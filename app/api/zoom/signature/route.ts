import { NextRequest, NextResponse } from 'next/server'
import { createZoomSignature } from '@/lib/zoom'
import { ZoomSignatureRequest } from '@/types/zoom'

export async function POST(req: NextRequest) {
  try {
    const body: ZoomSignatureRequest = await req.json()
    const { meetingNumber, role } = body

    if (!meetingNumber || role === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingNumber, role' },
        { status: 400 }
      )
    }

    if (role !== 0 && role !== 1) {
      return NextResponse.json(
        { error: 'Role must be 0 (attendee) or 1 (host)' },
        { status: 400 }
      )
    }

    const result = await createZoomSignature({ meetingNumber, role })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating Zoom signature:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    )
  }
}
