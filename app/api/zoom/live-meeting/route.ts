import { NextResponse } from 'next/server'
import { getLiveMeetingFromZoom } from '@/lib/zoom-api'

export async function GET() {
  try {
    // Check Zoom API directly for any live meetings
    // This works regardless of how the meeting was started (app or Zoom desktop)
    const zoomLiveMeeting = await getLiveMeetingFromZoom()

    if (zoomLiveMeeting) {
      console.log('Found live meeting from Zoom:', zoomLiveMeeting.id)
      return NextResponse.json({
        live: true,
        meeting: {
          meetingNumber: zoomLiveMeeting.id,
          password: zoomLiveMeeting.password || '',
          title: zoomLiveMeeting.topic || 'TGFX Livestream'
        }
      })
    }

    // No live meeting found
    return NextResponse.json({
      live: false,
      meeting: null
    })
  } catch (error) {
    console.error('Error checking live meeting:', error)
    return NextResponse.json(
      { error: 'Failed to check live meeting status' },
      { status: 500 }
    )
  }
}
