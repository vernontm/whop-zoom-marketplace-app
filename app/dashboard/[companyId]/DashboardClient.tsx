'use client'

import { useState } from 'react'
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

interface DashboardClientProps {
  companyId: string
  initialConfig: ZoomConfig
  hasWhopHeaders: boolean
}

export default function DashboardClient({ companyId, initialConfig, hasWhopHeaders }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [zoomConfig, setZoomConfig] = useState<ZoomConfig>(initialConfig)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} zoomConfigured={zoomConfig.configured} />
      <main className="flex-1 p-6 overflow-auto">
        {/* Show warning if no Whop headers */}
        {!hasWhopHeaders && (
          <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm">
            Company ID not found in Whop headers. Some features may not work correctly. 
            Make sure you are accessing this from within a Whop app.
          </div>
        )}
        
        {activeTab === 'overview' && <Overview companyId={companyId} zoomConfig={zoomConfig} />}
        {activeTab === 'meetings' && <Meetings companyId={companyId} />}
        {activeTab === 'settings' && <Settings companyId={companyId} onConfigUpdate={setZoomConfig} />}
        {activeTab === 'analytics' && <Analytics companyId={companyId} />}
      </main>
    </div>
  )
}
