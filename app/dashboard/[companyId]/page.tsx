'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from './components/Sidebar'
import Overview from './components/Overview'
import Meetings from './components/Meetings'
import Settings from './components/Settings'
import Analytics from './components/Analytics'

export type TabType = 'overview' | 'meetings' | 'settings' | 'analytics'

export interface ZoomConfig {
  configured: boolean
  accountId?: string
  clientId?: string
  sdkKey?: string
  defaultMeetingTitle?: string
  adminUsernames?: string[]
}

export default function DashboardPage() {
  const params = useParams()
  const companyId = params.companyId as string
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [zoomConfig, setZoomConfig] = useState<ZoomConfig>({ configured: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/settings/zoom')
        const data = await response.json()
        setZoomConfig({
          configured: data.configured || false,
          accountId: data.accountId,
          clientId: data.clientId,
          sdkKey: data.sdkKey,
          defaultMeetingTitle: data.defaultMeetingTitle,
          adminUsernames: data.adminUsernames
        })
      } catch (error) {
        console.error('Error fetching config:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview companyId={companyId} zoomConfig={zoomConfig} />
      case 'meetings':
        return <Meetings companyId={companyId} />
      case 'settings':
        return <Settings companyId={companyId} onConfigUpdate={setZoomConfig} />
      case 'analytics':
        return <Analytics companyId={companyId} />
      default:
        return <Overview companyId={companyId} zoomConfig={zoomConfig} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} zoomConfigured={zoomConfig.configured} />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}
