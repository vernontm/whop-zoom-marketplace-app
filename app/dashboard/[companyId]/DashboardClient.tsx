'use client'

import { useState } from 'react'
import Overview from './components/Overview'
import Settings from './components/Settings'
import HowTo from './components/HowTo'
import ClientPreview from './components/ClientPreview'

export type TabType = 'overview' | 'settings' | 'howto' | 'preview'

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
    { id: 'howto' as TabType, label: 'How To' },
    { id: 'preview' as TabType, label: 'Client Preview' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Horizontal Top Navigation */}
      <nav className="border-b border-zinc-800">
        <div className="px-6">
          <div className="flex items-center justify-between">
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
            <a
              href={`/experiences/${companyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && <Overview companyId={companyId} zoomConfig={zoomConfig} onNavigateToSettings={() => setActiveTab('settings')} />}
        {activeTab === 'settings' && <Settings companyId={companyId} onConfigUpdate={setZoomConfig} />}
        {activeTab === 'howto' && <HowTo />}
        {activeTab === 'preview' && <ClientPreview companyId={companyId} />}
      </main>
    </div>
  )
}
