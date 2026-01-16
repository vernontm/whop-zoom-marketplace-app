'use client'

import { useState } from 'react'
import Overview from './components/Overview'
import Settings from './components/Settings'

export type TabType = 'overview' | 'settings'

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

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'settings' as TabType, label: 'Configure Settings' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Horizontal Top Navigation */}
      <nav className="border-b border-zinc-800">
        <div className="px-6">
          <div className="flex items-center gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && <Overview companyId={companyId} zoomConfig={zoomConfig} />}
        {activeTab === 'settings' && <Settings companyId={companyId} onConfigUpdate={setZoomConfig} />}
      </main>
    </div>
  )
}
