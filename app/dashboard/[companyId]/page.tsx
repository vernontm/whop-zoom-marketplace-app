import { headers } from 'next/headers'
import { getCompanyZoomCredentials } from '@/lib/db'
import DashboardClient from './DashboardClient'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { companyId: urlCompanyId } = await params
  const headersList = await headers()
  
  // Get company ID from Whop headers, fallback to URL param
  const whopCompanyId = headersList.get('x-whop-company-id')
  const companyId = whopCompanyId || urlCompanyId
  
  // Fetch initial config server-side
  let zoomConfig = { configured: false, accountId: '', clientId: '', sdkKey: '', defaultMeetingTitle: 'Livestream' }
  
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
      hasWhopHeaders={!!whopCompanyId}
    />
  )
}
