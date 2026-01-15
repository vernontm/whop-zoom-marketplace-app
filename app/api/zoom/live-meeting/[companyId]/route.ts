import { NextResponse } from 'next/server'
import { getLiveMeetingForCompany } from '@/lib/zoom-api-multi'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { companyId } = await params
    
    console.log('Checking live meeting for company:', companyId)
    
    const liveMeeting = await getLiveMeetingForCompany(companyId)
    
    console.log('Live meeting result:', liveMeeting)

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
