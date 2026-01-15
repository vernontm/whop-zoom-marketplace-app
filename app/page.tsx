'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Meeting } from '@/types/meeting'

// Client-side helper to get default title with date
function getDefaultMeetingTitle(): string {
  const baseTitle = process.env.NEXT_PUBLIC_DEFAULT_MEETING_TITLE || 'TGFX Livestream'
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  
  return `${baseTitle} ${month}-${day}-${year}`
}

interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

export default function HomePage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [startingMeeting, setStartingMeeting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Meetings fetched via Zoom API in multi-tenant version
        setMeetings([])
        
        // TODO: Get actual user from Whop auth and check admin status
        setUser({
          id: 'demo-user',
          name: 'Rayvaughnfx',
          email: 'demo@example.com',
          isAdmin: true
        })

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartInstantMeeting = async () => {
    setStartingMeeting(true)
    setError(null)

    try {
      const response = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: getDefaultMeetingTitle()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start meeting')
      }

      // Redirect to meeting page with host=1 for admin
      router.push(`/meeting/live?meetingNumber=${data.meeting.meetingNumber}&password=${data.meeting.password}&title=${encodeURIComponent(data.meeting.title)}&host=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start meeting')
      setStartingMeeting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-600'
      case 'ended':
        return 'bg-gray-600'
      default:
        return 'bg-blue-600'
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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">TGFX Livestream</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-white flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Welcome, </span>
                  <span className="font-medium">{user.name}</span>
                  {user.isAdmin && (
                    <span className="px-2 py-0.5 bg-red-600 text-xs rounded">Admin</span>
                  )}
                </div>
              )}
              
              {user?.isAdmin && (
                <button 
                  onClick={handleStartInstantMeeting}
                  disabled={startingMeeting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {startingMeeting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Livestream
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-red-600 bg-opacity-20 border border-red-600 rounded text-red-400">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-4 text-red-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Livestream Meetings</h2>
          <p className="text-zinc-400">
            {user?.isAdmin 
              ? 'Start an instant livestream or view past meetings' 
              : 'Join livestream meetings'}
          </p>
        </div>

        {/* Quick Start Card for Admin */}
        {user?.isAdmin && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-900 to-green-800 rounded-lg border border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to go live?</h3>
                <p className="text-green-200">
                  Start an instant meeting with one click. Title: <span className="font-mono">{getDefaultMeetingTitle()}</span>
                </p>
              </div>
              <button 
                onClick={handleStartInstantMeeting}
                disabled={startingMeeting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 font-semibold flex items-center gap-2"
              >
                {startingMeeting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Go Live Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Past Meetings */}
        <h3 className="text-lg font-semibold text-white mb-4">Past Meetings</h3>
        
        {meetings.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No meetings yet</h3>
            <p className="text-zinc-400">
              {user?.isAdmin 
                ? 'Start your first livestream using the button above!'
                : 'No livestream meetings are currently available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {meeting.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                        meeting.status
                      )}`}
                    >
                      {meeting.status.toUpperCase()}
                    </span>
                  </div>

                  {meeting.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-zinc-500">
                    <div>
                      Meeting ID: <span className="font-mono">{meeting.zoom_meeting_id}</span>
                    </div>
                    {meeting.created_at && (
                      <div>
                        Created: {new Date(meeting.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/meeting/${meeting.id}`}
                      className={`block w-full px-4 py-2 text-white text-center rounded transition-colors ${
                        meeting.status === 'live' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {meeting.status === 'live' ? 'Join Now' : 'View Meeting'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
