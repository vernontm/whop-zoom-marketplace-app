import { KJUR } from 'jsrsasign'
import { ZoomSignatureRequest, ZoomSignatureResponse } from '@/types/zoom'

export function generateZoomSignature({ meetingNumber, role }: ZoomSignatureRequest): string {
  const sdkKey = process.env.ZOOM_SDK_KEY
  const sdkSecret = process.env.ZOOM_SDK_SECRET

  if (!sdkKey || !sdkSecret) {
    throw new Error('Zoom SDK credentials not configured')
  }

  // Remove any spaces or dashes from meeting number
  const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, '')

  const iat = Math.round(Date.now() / 1000) - 30
  const exp = iat + 60 * 60 * 2 // 2 hours

  const oHeader = { alg: 'HS256', typ: 'JWT' }
  const oPayload = {
    sdkKey: sdkKey,
    appKey: sdkKey, // Some SDK versions use appKey
    mn: cleanMeetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  
  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret)
  
  console.log('Generated signature for meeting:', cleanMeetingNumber, 'role:', role)
  
  return signature
}

export async function createZoomSignature(request: ZoomSignatureRequest): Promise<ZoomSignatureResponse> {
  const signature = generateZoomSignature(request)
  return { signature }
}

export function validateZoomConfig(): boolean {
  return !!(process.env.ZOOM_SDK_KEY && process.env.ZOOM_SDK_SECRET)
}
