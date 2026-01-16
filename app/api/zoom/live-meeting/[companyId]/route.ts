import { NextResponse } from 'next/server'
import { getLiveMeetingForCompany } from '@/lib/zoom-api-multi'
import { getLiveMeetingFromDatabase, hasRecentlyEndedMeeting } from '@/lib/meeting-status'
import { getCompanyZoomCredentials } from '@/lib/db'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { companyId } = await params
    
    console.log('Checking live meeting for company:', companyId)
    
    // Get company settings for defaultMeetingTitle and brandColor
    const credentials = await getCompanyZoomCredentials(companyId)
    const pageTitle = credentials?.defaultMeetingTitle || 'Zoom Meeting'
    const brandColor = credentials?.brandColor || '#5dc6ae'
    
    // First check database (populated by webhooks) - most reliable
    const dbMeeting = await getLiveMeetingFromDatabase(companyId)
    if (dbMeeting) {
      console.log('Found live meeting in database:', dbMeeting.id)
      return NextResponse.json({
        live: true,
        source: 'database',
        pageTitle,
        brandColor,
        meeting: {
          meetingNumber: dbMeeting.id,
          password: dbMeeting.password || '',
          title: dbMeeting.topic
        }
      })
    }
    
    // Check if there's a recently ended meeting - if so, trust the database and skip API
    const recentlyEnded = await hasRecentlyEndedMeeting(companyId)
    if (recentlyEnded) {
      console.log('Recently ended meeting found, not falling back to API')
      return NextResponse.json({
        live: false,
        pageTitle,
        brandColor,
        meeting: null,
        debug: { companyId, reason: 'recently_ended' }
      })
    }
    
    // Fallback to Zoom API check (only if no recent webhook data)
    const liveMeeting = await getLiveMeetingForCompany(companyId)
    
    console.log('Live meeting result from API:', liveMeeting)

    if (liveMeeting) {
      return NextResponse.json({
        live: true,
        pageTitle,
        brandColor,
        meeting: {
          meetingNumber: liveMeeting.id,
          password: liveMeeting.password || '',
          title: liveMeeting.topic
        }
      })
    }

    return NextResponse.json({
      live: false,
      pageTitle,
      brandColor,
      meeting: null,
      debug: { companyId }
    })
  } catch (error) {
    console.error('Error checking live meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check live meeting status', companyId: (await params).companyId },
      { status: 500 }
    )
  }
}
