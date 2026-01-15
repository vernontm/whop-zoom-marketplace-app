import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { endMeetingForCompany } from '@/lib/zoom-api-multi'
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
        { error: 'Only admins can end meetings' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { meetingId } = body

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    await endMeetingForCompany(companyId, meetingId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end meeting' },
      { status: 500 }
    )
  }
}
