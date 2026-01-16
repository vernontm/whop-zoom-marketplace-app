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
  
  // Try to verify user token - but don't require it
  let userId: string | null = null
  let isAdmin = true // Default to admin for now since we're in dashboard path
  let userName = 'Admin'
  
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
    // User token not available - this is okay for dashboard access
    // The dashboard path itself is protected by Whop's routing
    console.log('User token not available, using default admin access')
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
  
  // If not admin, show access denied
  if (!isAdmin && userId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-zinc-400">You need admin access to view this dashboard.</p>
        </div>
      </div>
    )
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
