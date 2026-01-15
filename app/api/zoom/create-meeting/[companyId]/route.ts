import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { 
  createInstantMeetingForCompany, 
  endAllLiveMeetingsForCompany,
  getDefaultMeetingTitleForCompany 
} from '@/lib/zoom-api-multi'
import { isCompanyAdmin } from '@/lib/db'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params
    const headersList = await headers()
    
    // Get username from Whop headers
    const username = headersList.get('x-whop-username') || ''
    
    // Check if user is admin for this company
    const isAdmin = await isCompanyAdmin(companyId, username)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can start meetings' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const title = body.title || await getDefaultMeetingTitleForCompany(companyId)

    // End all existing live meetings first
    await endAllLiveMeetingsForCompany(companyId)

    // Create new meeting
    const zoomMeeting = await createInstantMeetingForCompany(companyId, title)

    return NextResponse.json({
      success: true,
      meeting: {
        id: zoomMeeting.id,
        meetingNumber: String(zoomMeeting.id),
        password: zoomMeeting.password,
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        title
      }
    })
  } catch (error) {
    console.error('Error creating instant meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
