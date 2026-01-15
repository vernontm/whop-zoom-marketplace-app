import { NextRequest, NextResponse } from 'next/server'
import { generateZoomSignatureForCompany, getPublicSdkKeyForCompany } from '@/lib/zoom-signature-multi'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params
    const body = await req.json()
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

    const signature = await generateZoomSignatureForCompany(companyId, { meetingNumber, role })
    const sdkKey = await getPublicSdkKeyForCompany(companyId)
    
    console.log('Signature API response:', { 
      companyId, 
      meetingNumber, 
      role, 
      sdkKey: sdkKey?.substring(0, 8) + '...', 
      signatureLength: signature?.length 
    })
    
    return NextResponse.json({ signature, sdkKey })
  } catch (error) {
    console.error('Error generating Zoom signature:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate signature' },
      { status: 500 }
    )
  }
}
