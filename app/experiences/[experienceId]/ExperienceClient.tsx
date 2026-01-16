'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@whop/frosted-ui'

interface User {
  id: string
  username: string
  email: string
  isAdmin: boolean
}

interface ExperienceClientProps {
  experienceId: string
  companyId: string
  user: User
}

// Stream schedule
const STREAM_HOURS = '7:30 AM - 10:30 AM EST'
const STREAM_TITLE = 'Live Stream'

export default function ExperienceClient({ experienceId, companyId, user }: ExperienceClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [liveMeeting, setLiveMeeting] = useState<{
    meetingNumber: string
    password: string
    title: string
  } | null>(null)

  useEffect(() => {
    const checkForLiveMeeting = async () => {
      try {
        const response = await fetch(`/api/zoom/live-meeting/${companyId}`)
        const data = await response.json()
        
        if (data.live && data.meeting) {
          setLiveMeeting({
            meetingNumber: data.meeting.meetingNumber,
            password: data.meeting.password || '',
            title: STREAM_TITLE
          })
        } else {
          setLiveMeeting(null)
        }
      } catch (err) {
        console.error('Error checking for live meeting:', err)
        setLiveMeeting(null)
      } finally {
        setLoading(false)
      }
    }

    checkForLiveMeeting()

    // Poll for updates every 10 seconds
    const interval = setInterval(checkForLiveMeeting, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleJoinLive = () => {
    if (liveMeeting) {
      router.push(`/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&username=${encodeURIComponent(user.username)}&companyId=${companyId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // No live stream - show enhanced waiting message
  if (!liveMeeting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        {/* Admin Dashboard Button - always show for now until Whop headers are verified */}
        <a
          href={`/dashboard/${companyId}`}
          className="fixed top-4 right-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 z-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin Dashboard
        </a>

        <div className="text-center max-w-lg mx-auto">
          {/* Subtle background effect */}
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #5dc6ae 0%, transparent 70%)' }}></div>
            
            {/* Offline icon */}
            <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Offline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-500"></span>
            <span className="text-sm font-medium text-zinc-400">OFFLINE</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">{STREAM_TITLE}</h1>
          
          {/* Subtitle */}
          <p className="text-zinc-400 text-lg mb-6">
            No active stream right now
          </p>

          {/* Schedule card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-zinc-400 text-sm font-medium">Stream Schedule</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{STREAM_HOURS}</p>
            <p className="text-zinc-500 text-sm">Monday - Friday</p>
          </div>

          {/* Status indicator */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#5dc6ae' }}></div>
            </div>
            <span className="text-zinc-500 text-sm">Auto-refreshing...</span>
          </div>
        </div>
      </div>
    )
  }

  // Live stream exists - show enhanced join page
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Admin Dashboard Button - always show for now */}
      <a
        href={`/dashboard/${companyId}`}
        className="fixed top-4 right-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 z-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Admin Dashboard
      </a>

      <div className="text-center max-w-lg mx-auto">
        {/* Animated background glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #5dc6ae 0%, transparent 70%)' }}></div>
          
          {/* Live indicator icon */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full animate-pulse opacity-30" style={{ backgroundColor: '#5dc6ae' }}></div>
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5dc6ae' }}>
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            {/* Pulsing live dot */}
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#5dc6ae' }}></span>
              <span className="relative inline-flex rounded-full h-4 w-4" style={{ backgroundColor: '#5dc6ae' }}></span>
            </span>
          </div>
        </div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'rgba(93, 198, 174, 0.15)', border: '1px solid rgba(93, 198, 174, 0.3)' }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#5dc6ae' }}></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#5dc6ae' }}></span>
          </span>
          <span className="text-sm font-semibold tracking-wide" style={{ color: '#5dc6ae' }}>LIVE NOW</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#ffffff' }}>{STREAM_TITLE}</h1>
        
        {/* Description */}
        <p className="text-zinc-400 text-xl mb-8">
          The stream is live! Join now to watch.
        </p>

        {/* Join button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleJoinLive}
            className="px-10 py-4 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{ 
              backgroundColor: '#5dc6ae',
              boxShadow: '0 6px 30px rgba(93, 198, 174, 0.4)'
            }}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Join Meeting
          </button>
        </div>

        {/* Welcome message */}
        <p className="text-zinc-400 text-base">
          Welcome, <span className="text-white font-medium">{user.username}</span>
        </p>
      </div>
    </div>
  )
}
