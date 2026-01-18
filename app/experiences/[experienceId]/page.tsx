import { headers } from 'next/headers'
import { isCompanyAdmin } from '@/lib/db'
import { whopsdk, checkUserAccessLevel, getCompanyIdFromExperience, checkCompanyAppSubscription } from '@/lib/whop-sdk'
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
  
  // Check if the COMPANY OWNER has an active subscription to the app
  // This gates the entire app - if the Whop owner hasn't paid, no one can access
  const companyHasSubscription = await checkCompanyAppSubscription(companyId)
  console.log('Company subscription check:', { companyId, companyHasSubscription })
  
  // User is admin if: header says admin, OR in company admin list, OR admin mode (for testing)
  const userIsAdmin = isWhopAdmin || await isCompanyAdmin(companyId, username) || isAdminMode
  
  // Access is granted if:
  // 1. The company owner has paid for the app subscription, AND
  // 2. The user has access to this experience (via Whop headers or SDK check)
  let userHasExperienceAccess = whopHasAccess || userIsAdmin
  
  if (!userHasExperienceAccess && userId) {
    try {
      const access = await checkUserAccessLevel(experienceId, userId)
      userHasExperienceAccess = access.hasAccess
      console.log('User experience access check:', { experienceId, userId, hasAccess: access.hasAccess })
    } catch (e) {
      console.error('Error checking access level:', e)
    }
  }
  
  console.log('User info:', { userId, username, whopUsername, isAdminMode, userIsAdmin, companyHasSubscription, userHasExperienceAccess, companyId, whopUserRole, isWhopAdmin })
  
  // If the company owner hasn't subscribed to the app, show empty/nothing for regular users
  if (!companyHasSubscription && !isAdminMode) {
    return (
      <div className="min-h-screen bg-zinc-950">
        {/* Empty state - app not activated, don't show anything to end users */}
      </div>
    )
  }
  
  // If user doesn't have access to this specific experience, show access denied
  if (!userHasExperienceAccess && !isAdminMode) {
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
            You don't have access to this experience. Please contact the Whop owner for access.
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
