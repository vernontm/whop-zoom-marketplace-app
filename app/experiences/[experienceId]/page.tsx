import { headers } from 'next/headers'
import { isCompanyAdmin } from '@/lib/db'
import { whopsdk, checkUserAccessLevel, getCompanyIdFromExperience } from '@/lib/whop-sdk'
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
  
  // Get company ID from headers, or resolve from experience ID
  let companyId = headersList.get('x-whop-company-id')
  
  // If no company ID from headers, resolve it from the experience ID
  if (!companyId && experienceId.startsWith('exp_')) {
    companyId = await getCompanyIdFromExperience(experienceId)
    console.log('Resolved company ID from experience:', companyId)
  }
  
  // Final fallback to experienceId (for biz_ IDs or if resolution fails)
  companyId = companyId || experienceId
  
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
  
  // Check if user has paid access to this experience/product
  let hasAccess = whopHasAccess // Trust header if present
  
  if (userId) {
    try {
      const access = await checkUserAccessLevel(experienceId, userId)
      hasAccess = hasAccess || access.hasAccess
      console.log('Access check for experience:', { experienceId, userId, hasAccess: access.hasAccess })
    } catch (e) {
      console.error('Error checking access level:', e)
    }
  }
  
  // User is admin if: header says admin, OR in company admin list, OR admin mode (for testing)
  const userIsAdmin = isWhopAdmin || await isCompanyAdmin(companyId, username) || isAdminMode
  
  // Admins always have access
  if (userIsAdmin) {
    hasAccess = true
  }
  
  console.log('User info:', { userId, username, whopUsername, isAdminMode, userIsAdmin, hasAccess, companyId, whopUserRole, isWhopAdmin })
  
  // If user doesn't have access, show access denied page
  if (!hasAccess && !isAdminMode) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Required</h1>
          <p className="text-zinc-400 mb-6">
            You need to purchase access to view this content.
          </p>
          <a 
            href="https://whop.com/api-app-e4b-hovrp-3bh-qss-premium-access-to-zoom/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Get Access
          </a>
          <p className="text-zinc-500 text-sm mt-4">
            Already purchased? Try refreshing the page.
          </p>
        </div>
      </div>
    )
  }
  
  const effectiveUserId = userId || 'whop-user'
  
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
