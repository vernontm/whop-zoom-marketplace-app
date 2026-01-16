import { headers } from 'next/headers'
import { getCompanyZoomCredentials } from '@/lib/db'
import { whopsdk, checkUserAccessLevel } from '@/lib/whop-sdk'
import DashboardClient from './DashboardClient'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { companyId } = await params
  const headersList = await headers()
  
  // Verify user token - REQUIRED for dashboard access
  let userId: string | null = null
  let isAdmin = false
  let userName = 'User'
  
  try {
    const { userId: verifiedUserId } = await whopsdk.verifyUserToken(headersList)
    userId = verifiedUserId
    
    if (userId) {
      // Check user access level
      const access = await checkUserAccessLevel(companyId, userId)
      isAdmin = access.isAdmin
      
      // Get user info
      try {
        const user = await whopsdk.users.retrieve(userId)
        userName = user.name || `@${user.username}` || 'User'
      } catch (e) {
        console.error('Error fetching user:', e)
      }
    }
  } catch (error) {
    // User token not available - deny access
    console.log('User token not available, denying access')
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-zinc-400">Please access this dashboard through Whop.</p>
        </div>
      </div>
    )
  }
  
  // If no userId after token verification, deny access
  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-zinc-400">Please access this dashboard through Whop.</p>
        </div>
      </div>
    )
  }
  
  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-zinc-400">You need admin access to view this dashboard.</p>
        </div>
      </div>
    )
  }
  
  // Fetch initial config server-side
  let zoomConfig = { configured: false, accountId: '', clientId: '', sdkKey: '', defaultMeetingTitle: 'Meeting' }
  
  if (companyId && companyId !== 'demo') {
    try {
      const credentials = await getCompanyZoomCredentials(companyId)
      if (credentials) {
        zoomConfig = {
          configured: true,
          accountId: credentials.accountId?.substring(0, 4) + '••••' + credentials.accountId?.substring(credentials.accountId.length - 4) || '',
          clientId: credentials.clientId?.substring(0, 4) + '••••' + credentials.clientId?.substring(credentials.clientId.length - 4) || '',
          sdkKey: credentials.sdkKey?.substring(0, 4) + '••••' + credentials.sdkKey?.substring(credentials.sdkKey.length - 4) || '',
          defaultMeetingTitle: credentials.defaultMeetingTitle || 'Livestream'
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }
  
  return (
    <DashboardClient 
      companyId={companyId} 
      initialConfig={zoomConfig}
      userName={userName}
      isAdmin={isAdmin}
    />
  )
}
