'use client'

import { useState } from 'react'

interface MeetingControlsProps {
  client: any
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onLeaveMeeting?: () => void
}

export default function MeetingControls({
  client,
  isFullscreen,
  onToggleFullscreen,
  onLeaveMeeting
}: MeetingControlsProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  const toggleMute = async () => {
    if (!client) return
    
    try {
      const mediaStream = client.getMediaStream()
      if (isMuted) {
        await mediaStream.unmuteAudio()
      } else {
        await mediaStream.muteAudio()
      }
      setIsMuted(!isMuted)
    } catch (error) {
      console.error('Error toggling mute:', error)
    }
  }

  const toggleVideo = async () => {
    if (!client) return
    
    try {
      const mediaStream = client.getMediaStream()
      if (isVideoOff) {
        await mediaStream.startVideo()
      } else {
        await mediaStream.stopVideo()
      }
      setIsVideoOff(!isVideoOff)
    } catch (error) {
      console.error('Error toggling video:', error)
    }
  }

  const handleLeaveMeeting = () => {
    if (client) {
      try {
        client.leave()
      } catch (error) {
        console.error('Error leaving meeting:', error)
      }
    }
    onLeaveMeeting?.()
  }

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-gray-800 border-t border-gray-700">
      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className={`p-3 rounded-full transition-colors ${
          isMuted
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Video Button */}
      <button
        onClick={toggleVideo}
        className={`p-3 rounded-full transition-colors ${
          isVideoOff
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isVideoOff ? 'Start Video' : 'Stop Video'}
      >
        {isVideoOff ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {/* Fullscreen Button */}
      <button
        onClick={onToggleFullscreen}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Leave Meeting Button */}
      <button
        onClick={handleLeaveMeeting}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
        title="Leave Meeting"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  )
}
