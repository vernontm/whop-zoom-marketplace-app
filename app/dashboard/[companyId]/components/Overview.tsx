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

  useEffect(() => {
    checkLiveMeeting()
    const interval = setInterval(checkLiveMeeting, 10000)
    return () => clearInterval(interval)
  }, [companyId])

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
        body: JSON.stringify({ title: getDefaultTitle() })
      })
      const data = await response.json()
      if (data.success) {
        setLiveMeeting({
          meetingNumber: data.meeting.meetingNumber,
          password: data.meeting.password,
          title: data.meeting.title
        })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
          <p className="text-zinc-500 mt-1">Manage your Zoom meetings</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Auto-refreshing
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Status Card */}
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-500 text-sm font-medium">Live Status</span>
            {liveMeeting ? (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                LIVE
              </span>
            ) : (
              <span className="px-2 py-1 bg-zinc-800 text-zinc-500 text-xs font-medium rounded-full">
                OFFLINE
              </span>
            )}
          </div>
          {liveMeeting ? (
            <div>
              <p className="text-white font-semibold text-lg">{liveMeeting.title}</p>
              <p className="text-zinc-500 text-sm mt-1">Meeting #{liveMeeting.meetingNumber}</p>
            </div>
          ) : (
            <p className="text-zinc-400">No active stream</p>
          )}
        </div>

        {/* Zoom Status Card */}
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-500 text-sm font-medium">Zoom Connection</span>
            {zoomConfig.configured ? (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full">
                Connected
              </span>
            ) : (
              <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-medium rounded-full">
                Not Setup
              </span>
            )}
          </div>
          {zoomConfig.configured ? (
            <div>
              <p className="text-white font-semibold">Ready to stream</p>
              <p className="text-zinc-500 text-sm mt-1">SDK Key: {zoomConfig.sdkKey?.slice(0, 8)}...</p>
            </div>
          ) : (
            <p className="text-zinc-400">Configure in Settings</p>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
          <span className="text-zinc-500 text-sm font-medium">Quick Actions</span>
          <div className="mt-4">
            {zoomConfig.configured ? (
              liveMeeting ? (
                <a
                  href={`/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&host=1&companyId=${companyId}`}
                  className="block w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-center font-semibold rounded-xl transition-colors"
                >
                  Join Live Stream
                </a>
              ) : (
                <button
                  onClick={startMeeting}
                  disabled={isStarting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
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
              )
            ) : (
              <p className="text-zinc-500 text-sm">Setup Zoom to start streaming</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Meeting Details */}
      {liveMeeting && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{liveMeeting.title}</h3>
                <p className="text-zinc-400 text-sm">
                  Meeting ID: {liveMeeting.meetingNumber} • Password: {liveMeeting.password}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&companyId=${companyId}`)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&host=1&companyId=${companyId}`}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
              >
                Open Stream
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-[#151515] border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-zinc-500">
          <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Activity tracking coming soon</p>
        </div>
      </div>
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
