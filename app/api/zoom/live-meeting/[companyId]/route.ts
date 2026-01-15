import { NextResponse } from 'next/server'
import { getLiveMeetingForCompany } from '@/lib/zoom-api-multi'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { companyId } = await params
    
    const liveMeeting = await getLiveMeetingForCompany(companyId)

    if (liveMeeting) {
      return NextResponse.json({
        live: true,
        meeting: {
          meetingNumber: liveMeeting.id,
          password: liveMeeting.password || '',
          title: liveMeeting.topic
        }
      })
    }

    return NextResponse.json({
      live: false,
      meeting: null
    })
  } catch (error) {
    console.error('Error checking live meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check live meeting status' },
      { status: 500 }
    )
  }
}
