import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SellerSettingsClient from './SellerSettingsClient'

export default async function SellerPage() {
  const headersList = await headers()
  
  // Get company info from Whop headers
  const companyId = headersList.get('x-whop-company-id')
  const isAdmin = headersList.get('x-whop-is-admin') === 'true'
  const companyTitle = headersList.get('x-whop-company-title') || 'Your Company'
  
  // For development, allow access without headers
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!companyId && !isDev) {
    redirect('/')
  }
  
  if (!isAdmin && !isDev) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-zinc-400">Only company owners can access settings.</p>
        </div>
      </div>
    )
  }
  
  return (
    <SellerSettingsClient 
      companyId={companyId || 'dev-company'} 
      companyTitle={companyTitle}
    />
  )
}
