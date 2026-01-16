'use client'

import { useState, useEffect } from 'react'
import { ZoomConfig } from '../DashboardClient'

interface OverviewProps {
  companyId: string
  zoomConfig: ZoomConfig
}

interface LiveMeeting {
  meetingNumber: string
  password: string
  title: string
}

export default function Overview({ companyId, zoomConfig }: OverviewProps) {
  const [liveMeeting, setLiveMeeting] = useState<LiveMeeting | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [checkingLive, setCheckingLive] = useState(true)
  const [showStartModal, setShowStartModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkLiveMeeting()
    const interval = setInterval(checkLiveMeeting, 10000)
    return () => clearInterval(interval)
  }, [companyId])

  useEffect(() => {
    setMeetingTitle(getDefaultTitle())
  }, [])

  const checkLiveMeeting = async () => {
    try {
      const response = await fetch(`/api/zoom/live-meeting/${companyId}`)
      const data = await response.json()
      if (data.live && data.meeting) {
        setLiveMeeting(data.meeting)
      } else {
        setLiveMeeting(null)
      }
    } catch (error) {
      console.error('Error checking live meeting:', error)
    } finally {
      setCheckingLive(false)
    }
  }

  const startMeeting = async () => {
    setIsStarting(true)
    try {
      const response = await fetch(`/api/zoom/create-meeting/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingTitle || getDefaultTitle() })
      })
      const data = await response.json()
      if (data.success) {
        setLiveMeeting({
          meetingNumber: data.meeting.meetingNumber,
          password: data.meeting.password,
          title: data.meeting.title
        })
        setShowStartModal(false)
      }
    } catch (error) {
      console.error('Error starting meeting:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const getDefaultTitle = () => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const year = today.getFullYear()
    return `Meeting ${month}-${day}-${year}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getMeetingLink = () => {
    if (!liveMeeting) return ''
    return `${window.location.origin}/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&companyId=${companyId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Manage your Zoom meetings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Live
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Live Status Card - Large */}
          <div className={`rounded-2xl p-6 border ${liveMeeting ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20' : 'bg-[#151515] border-zinc-800'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${liveMeeting ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                  <VideoIcon className={`w-6 h-6 ${liveMeeting ? 'text-emerald-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Meeting Status</h2>
                  <p className="text-zinc-500 text-sm">Real-time status</p>
                </div>
              </div>
              {liveMeeting ? (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 text-sm font-semibold rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  LIVE NOW
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-zinc-800 text-zinc-500 text-sm font-medium rounded-full">
                  OFFLINE
                </span>
              )}
            </div>

            {liveMeeting ? (
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-white font-semibold text-xl mb-1">{liveMeeting.title}</p>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <HashIcon className="w-4 h-4" />
                      {liveMeeting.meetingNumber}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <LockIcon className="w-4 h-4" />
                      {liveMeeting.password}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ShareIcon className="w-5 h-5" />
                    Share
                  </button>
                  <a
                    href={`/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&host=1&companyId=${companyId}`}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Join Meeting
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-400">No active meeting. Start one to begin.</p>
                {zoomConfig.configured ? (
                  <button
                    onClick={() => setShowStartModal(true)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Start New Meeting
                  </button>
                ) : (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-orange-400 text-sm">Configure Zoom in Settings to start meetings</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-zinc-500 text-sm">Total Viewers</p>
            </div>
            <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">0h</p>
              <p className="text-zinc-500 text-sm">Total Duration</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Connection Status Card */}
          <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${zoomConfig.configured ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
                <ZoomIcon className={`w-6 h-6 ${zoomConfig.configured ? 'text-emerald-500' : 'text-orange-500'}`} />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Zoom Connection</h2>
                <p className="text-zinc-500 text-sm">API & SDK Status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400">API Status</span>
                {zoomConfig.configured ? (
                  <span className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                    <CheckCircleIcon className="w-4 h-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-orange-500 text-sm font-medium">
                    <AlertCircleIcon className="w-4 h-4" />
                    Not Configured
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400">SDK Key</span>
                <span className="text-white font-mono text-sm">
                  {zoomConfig.sdkKey ? `${zoomConfig.sdkKey.slice(0, 8)}...` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-zinc-400">Account ID</span>
                <span className="text-white font-mono text-sm">
                  {zoomConfig.accountId || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => zoomConfig.configured && setShowStartModal(true)}
                disabled={!zoomConfig.configured || !!liveMeeting}
                className="p-4 bg-zinc-800/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
                  <PlayIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-white font-medium text-sm">Start Meeting</p>
                <p className="text-zinc-500 text-xs mt-0.5">Begin a new session</p>
              </button>
              <button
                onClick={() => liveMeeting && setShowShareModal(true)}
                disabled={!liveMeeting}
                className="p-4 bg-zinc-800/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                  <ShareIcon className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-white font-medium text-sm">Share Link</p>
                <p className="text-zinc-500 text-xs mt-0.5">Invite participants</p>
              </button>
              <button
                onClick={() => liveMeeting && copyToClipboard(liveMeeting.meetingNumber)}
                disabled={!liveMeeting}
                className="p-4 bg-zinc-800/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                  <CopyIcon className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-white font-medium text-sm">Copy ID</p>
                <p className="text-zinc-500 text-xs mt-0.5">Meeting number</p>
              </button>
              <a
                href={liveMeeting ? `/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&host=1&companyId=${companyId}` : '#'}
                className={`p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors text-left ${!liveMeeting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-3">
                  <ExternalLinkIcon className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-white font-medium text-sm">Open Meeting</p>
                <p className="text-zinc-500 text-xs mt-0.5">Join as host</p>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Start Meeting Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Start New Meeting</h2>
              <button
                onClick={() => setShowStartModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <XIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Enter meeting title..."
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startMeeting}
                  disabled={isStarting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isStarting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Starting...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      Start Meeting
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && liveMeeting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Share Meeting</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <XIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Meeting Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getMeetingLink()}
                    readOnly
                    className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-mono truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(getMeetingLink())}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                  >
                    {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs mb-1">Meeting ID</p>
                  <p className="text-white font-mono">{liveMeeting.meetingNumber}</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs mb-1">Password</p>
                  <p className="text-white font-mono">{liveMeeting.password}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors mt-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.5 4.5h15a2 2 0 012 2v11a2 2 0 01-2 2h-15a2 2 0 01-2-2v-11a2 2 0 012-2zm10.5 6l3.5-2v7l-3.5-2v-3z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
