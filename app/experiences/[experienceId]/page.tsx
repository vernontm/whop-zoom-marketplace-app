import { headers } from 'next/headers'
import { isCompanyAdmin } from '@/lib/db'
import { whopsdk, checkUserAccessLevel } from '@/lib/whop-sdk'
import ExperienceClient from './ExperienceClient'

interface PageProps {
  params: Promise<{ experienceId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Decode JWT without verification (just to read payload)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

// Fetch user info from Whop API using the user token
async function getWhopUserFromToken(userToken: string): Promise<{ username: string; email: string } | null> {
  try {
    console.log('Fetching Whop user with token')
    const response = await fetch('https://api.whop.com/api/v5/me', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.error('Whop /me API error:', response.status, await response.text())
      return null
    }
    
    const data = await response.json()
    console.log('Whop API response:', JSON.stringify(data, null, 2))
    
    // Try multiple possible field names for username
    const username = data.username || data.name || data.social?.username || data.public_username || data.id || 'Viewer'
    console.log('Resolved username:', username)
    
    return {
      username,
      email: data.email || ''
    }
  } catch (err) {
    console.error('Failed to fetch Whop user:', err)
    return null
  }
}

export default async function ExperiencePage({ params, searchParams }: PageProps) {
  const { experienceId } = await params
  const query = await searchParams
  const headersList = await headers()
  
  // Get Whop headers
  const whopUserToken = headersList.get('x-whop-user-token')
  const whopUsernameHeader = headersList.get('x-whop-username')
  const whopUserIdHeader = headersList.get('x-whop-user-id')
  const whopUserEmailHeader = headersList.get('x-whop-user-email')
  
  console.log('Whop headers:', {
    tokenPresent: !!whopUserToken,
    usernameHeader: whopUsernameHeader,
    userIdHeader: whopUserIdHeader,
    emailHeader: whopUserEmailHeader
  })
  
  let userId: string | null = whopUserIdHeader
  let whopUsername: string | null = whopUsernameHeader
  let email = whopUserEmailHeader || ''
  
  // If we have the username header directly, use it
  // Otherwise, try to fetch from API using the token
  if (!whopUsername && whopUserToken) {
    console.log('No username header, trying API with token...')
    const payload = decodeJwtPayload(whopUserToken)
    if (payload && payload.sub) {
      userId = payload.sub as string
      
      // Fetch user details from Whop API
      const whopUser = await getWhopUserFromToken(whopUserToken)
      if (whopUser) {
        whopUsername = whopUser.username
        email = whopUser.email
      }
    }
  }
  
  // Get company ID from headers, or use experienceId as fallback (they're often the same)
  const companyId = headersList.get('x-whop-company-id') || experienceId
  
  // Check if user has admin/owner role from Whop headers
  // Whop sends various headers to indicate user role
  const whopUserRole = headersList.get('x-whop-user-role') || ''
  const whopIsAdmin = headersList.get('x-whop-is-admin') === 'true'
  const whopHasAccess = headersList.get('x-whop-has-access') === 'true'
  
  // Log all whop headers for debugging
  console.log('Whop headers:', {
    companyId: headersList.get('x-whop-company-id'),
    userRole: whopUserRole,
    isAdmin: headersList.get('x-whop-is-admin'),
    hasAccess: headersList.get('x-whop-has-access'),
    userToken: whopUserToken ? 'present' : 'missing'
  })
  
  const isWhopAdmin = whopUserRole === 'admin' || whopUserRole === 'owner' || whopUserRole === 'moderator' || whopIsAdmin
  
  // Use Whop username, or check for admin query param for testing
  const isAdminMode = query.admin === '1' || query.admin === 'true'
  // Generate a unique viewer name if no Whop username is available
  const defaultViewerName = `Viewer_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const username = whopUsername || (isAdminMode ? 'Rayvaughnfx' : defaultViewerName)
  
  // For development/testing, allow access without Whop headers
  const effectiveUserId = userId || 'whop-user'
  // Check if user is authorized on the company (admin/owner) using Whop SDK
  let isAuthorizedAdmin = false
  if (userId) {
    try {
      const access = await checkUserAccessLevel(companyId, userId)
      isAuthorizedAdmin = access.isAdmin
    } catch (e) {
      console.error('Error checking access level:', e)
    }
  }
  
  // User is admin if: Whop SDK says authorized, OR header says admin, OR in company admin list, OR admin mode
  const userIsAdmin = isAuthorizedAdmin || isWhopAdmin || await isCompanyAdmin(companyId, username) || isAdminMode
  
  console.log('User info:', { userId, username, whopUsername, isAdminMode, userIsAdmin, companyId, whopUserRole, isWhopAdmin, isAuthorizedAdmin })
  
  return (
    <ExperienceClient
      experienceId={experienceId}
      companyId={companyId}
      user={{
        id: effectiveUserId,
        username,
        email,
        isAdmin: userIsAdmin
      }}
    />
  )
}
