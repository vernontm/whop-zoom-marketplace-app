'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function MeetingLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading meeting...</p>
      </div>
    </div>
  )
}

function LiveMeetingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const meetingNumber = searchParams.get('meetingNumber') || ''
  const password = searchParams.get('password') || ''
  const title = searchParams.get('title') || 'Livestream'
  const usernameFromUrl = searchParams.get('username') || ''
  const isHost = searchParams.get('host') === '1'
  const companyId = searchParams.get('companyId') || 'dev-company'
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [displayName, setDisplayName] = useState<string>(usernameFromUrl || 'Viewer')
  const initStarted = useRef(false)

  // Load Zoom SDK and join meeting
  useEffect(() => {
    if (!meetingNumber || initStarted.current) return
    initStarted.current = true

    const initZoomSDK = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // First check if there's actually a live meeting
        const liveCheckResponse = await fetch(`/api/zoom/live-meeting/${companyId}`)
        const liveCheckData = await liveCheckResponse.json()
        
        if (!liveCheckData.live) {
          setError('no_stream')
          setIsLoading(false)
          return
        }

        // Use username from URL (passed from experience page which has Whop headers)
        const userName = usernameFromUrl || 'Viewer'
        setDisplayName(userName)
        console.log('Joining as:', userName)

        // Dynamically import the Zoom SDK
        const { ZoomMtg } = await import('@zoom/meetingsdk')
        
        ZoomMtg.preLoadWasm()
        ZoomMtg.prepareWebSDK()

        // Get signature from our API (multi-tenant)
        const signatureResponse = await fetch(`/api/zoom/signature/${companyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingNumber: meetingNumber,
            role: 0 // 0 = attendee, 1 = host
          })
        })

        if (!signatureResponse.ok) {
          throw new Error('Failed to get meeting signature')
        }

        const { signature, sdkKey } = await signatureResponse.json()

        if (!sdkKey) {
          throw new Error('Zoom SDK key not configured for this company')
        }

        // Initialize the SDK - viewers can hear audio but start muted, no video
        ZoomMtg.init({
          leaveUrl: window.location.origin + '/experiences/test',
          patchJsMedia: true,
          disablePreview: true,
          disableCallOut: true,
          disableRecord: true,
          audioPanelAlwaysOpen: false,
          showMeetingHeader: false,
          disableInvite: true,
          meetingInfo: ['topic', 'host'],
          isSupportAV: true,
          defaultView: 'gallery',
          success: () => {
            console.log('Zoom SDK initialized')
            
            // Join the meeting as view-only (no audio/video)
            ZoomMtg.join({
              signature: signature,
              sdkKey: sdkKey,
              meetingNumber: meetingNumber,
              userName: userName,
              passWord: password,
              success: () => {
                console.log('Joined meeting successfully')
                setIsLoading(false)
                setSdkReady(true)
              },
              error: (err: Error) => {
                console.error('Failed to join meeting:', err)
                setError('Failed to join meeting. Please try again.')
                setIsLoading(false)
              }
            })
          },
          error: (err: Error) => {
            console.error('Failed to initialize Zoom SDK:', err)
            setError('Failed to initialize Zoom. Please try again.')
            setIsLoading(false)
          }
        })
      } catch (err) {
        console.error('Error setting up Zoom:', err)
        setError(err instanceof Error ? err.message : 'Failed to load Zoom')
        setIsLoading(false)
      }
    }

    initZoomSDK()
  }, [meetingNumber, password, usernameFromUrl])

  const handleEndMeeting = async () => {
    if (confirm('Are you sure you want to end this meeting?')) {
      try {
        await fetch(`/api/zoom/end-meeting/${companyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId: meetingNumber })
        })
      } catch (err) {
        console.error('Error ending meeting:', err)
      }
      router.push('/')
    }
  }

  if (!meetingNumber) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Meeting</h1>
          <p className="text-zinc-400 mb-6">No meeting number provided.</p>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  // Host view - show controls while Zoom opens in new tab
  if (isHost) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-500 font-semibold">LIVE</span>
              </div>
              <h1 className="text-lg font-semibold text-white">{decodeURIComponent(title)}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <a href="/" className="px-3 py-1.5 bg-zinc-700 text-white text-sm rounded hover:bg-zinc-600">
                Back
              </a>
              <button
                onClick={handleEndMeeting}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                End Meeting
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Zoom Desktop App Launching</h2>
            <p className="text-zinc-400 mb-6">
              Your Zoom desktop app should open automatically. Start your livestream there. Viewers will join via the web client.
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              If Zoom didn&apos;t open, <a href={`https://zoom.us/j/${meetingNumber}?pwd=${password}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">click here to join manually</a>.
            </p>
            
            <div className="bg-zinc-800 rounded-lg p-4 text-left mb-6">
              <h3 className="text-white font-semibold mb-3">Meeting Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Meeting ID:</span>
                  <span className="text-white font-mono">{meetingNumber}</span>
                </div>
                {password && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Password:</span>
                    <span className="text-white font-mono">{password}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => window.open(`https://zoom.us/wc/${meetingNumber}/start?pwd=${password}`, '_blank')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Reopen Zoom
            </button>
          </div>
        </main>
      </div>
    )
  }

  // No stream available popup
  if (error === 'no_stream') {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(93, 198, 174, 0.15)' }}>
            <svg className="w-10 h-10" style={{ color: '#5dc6ae' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Active Stream</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            There&apos;s no live stream right now. Please check back later during stream hours.
          </p>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mb-6">
            <p className="text-zinc-400 text-sm mb-1">Stream Schedule</p>
            <p className="text-white font-semibold">7:30 AM - 10:30 AM EST</p>
            <p className="text-zinc-500 text-xs mt-1">Monday - Friday</p>
          </div>
          <button 
            onClick={() => router.push('/experiences/test')}
            className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: '#5dc6ae' }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Other errors
  if (error) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Join Meeting</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/experiences/test')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Joining {decodeURIComponent(title)}...</p>
          <p className="text-zinc-500 text-sm mt-2">Connecting as {displayName}</p>
        </div>
      </div>
    )
  }

  // When SDK is ready, it takes over the page - return empty div
  // The Zoom SDK Client View renders its own full-page UI
  return <div id="zmmtg-root"></div>
}

export default function LiveMeetingPage() {
  return (
    <Suspense fallback={<MeetingLoader />}>
      <LiveMeetingContent />
    </Suspense>
  )
}
