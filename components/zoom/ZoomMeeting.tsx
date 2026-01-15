'use client'

import { useEffect, useRef, useState } from 'react'

interface ZoomMeetingProps {
  meetingNumber: string
  password?: string
  userName: string
  userEmail: string
  role: 0 | 1
  onFullscreenToggle?: () => void
  onMeetingJoined?: () => void
  onMeetingLeft?: () => void
}

declare global {
  interface Window {
    ZoomMtgEmbedded: any
  }
}

export default function ZoomMeeting({
  meetingNumber,
  password,
  userName,
  userEmail,
  role,
  onMeetingJoined,
  onMeetingLeft
}: ZoomMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const initializingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initializingRef.current || clientRef.current) return
    if (!containerRef.current || typeof window === 'undefined') return

    initializingRef.current = true
    let mounted = true

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.onload = () => resolve()
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const initializeZoom = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load Zoom SDK from CDN
        await loadScript('https://source.zoom.us/3.1.6/lib/vendor/react.min.js')
        await loadScript('https://source.zoom.us/3.1.6/lib/vendor/react-dom.min.js')
        await loadScript('https://source.zoom.us/3.1.6/lib/vendor/redux.min.js')
        await loadScript('https://source.zoom.us/3.1.6/lib/vendor/redux-thunk.min.js')
        await loadScript('https://source.zoom.us/3.1.6/lib/vendor/lodash.min.js')
        await loadScript('https://source.zoom.us/zoom-meeting-embedded-3.1.6.min.js')

        // Wait for SDK to be available
        await new Promise(resolve => setTimeout(resolve, 500))

        const ZoomMtgEmbedded = window.ZoomMtgEmbedded

        if (!ZoomMtgEmbedded) {
          throw new Error('Zoom SDK failed to load')
        }

        const client = ZoomMtgEmbedded.createClient()
        clientRef.current = client

        await client.init({
          zoomAppRoot: containerRef.current!,
          language: 'en-US',
          patchJsMedia: true,
          leaveOnPageUnload: true,
        })

        // Get signature
        const signatureResponse = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber, role }),
        })

        if (!signatureResponse.ok) throw new Error('Failed to get signature')

        const { signature } = await signatureResponse.json()

        await client.join({
          signature,
          sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || '',
          meetingNumber,
          userName,
          userEmail,
          password: password || '',
        })

        if (mounted) {
          setIsLoading(false)
          onMeetingJoined?.()
        }

        client.on('connection-change', (payload: any) => {
          if (payload.state === 'Closed' && mounted) {
            onMeetingLeft?.()
          }
        })

      } catch (err: any) {
        console.error('Zoom error:', err)
        if (err?.errorCode === 5012) {
          if (mounted) setIsLoading(false)
          return
        }
        if (mounted) {
          setError(err?.message || 'Failed to initialize meeting')
          setIsLoading(false)
        }
        initializingRef.current = false
      }
    }

    initializeZoom()

    return () => {
      mounted = false
      if (clientRef.current) {
        try { clientRef.current.leave() } catch (e) {}
        clientRef.current = null
      }
      initializingRef.current = false
    }
  }, [meetingNumber, password, userName, userEmail, role, onMeetingJoined, onMeetingLeft])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Joining meeting...</p>
          </div>
        </div>
      )}
      
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      />
    </div>
  )
}
