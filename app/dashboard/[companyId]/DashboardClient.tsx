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
  userName: string
  isAdmin: boolean
}

export default function DashboardClient({ companyId, initialConfig, userName, isAdmin }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [zoomConfig, setZoomConfig] = useState<ZoomConfig>(initialConfig)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} zoomConfigured={zoomConfig.configured} />
      <main className="flex-1 p-6 overflow-auto">
        {/* Welcome header */}
        <div className="mb-6">
          <p className="text-zinc-400 text-sm">Welcome, <span className="text-white font-medium">{userName}</span></p>
        </div>
        
        {activeTab === 'overview' && <Overview companyId={companyId} zoomConfig={zoomConfig} />}
        {activeTab === 'meetings' && <Meetings companyId={companyId} />}
        {activeTab === 'settings' && <Settings companyId={companyId} onConfigUpdate={setZoomConfig} />}
        {activeTab === 'analytics' && <Analytics companyId={companyId} />}
      </main>
    </div>
  )
}
