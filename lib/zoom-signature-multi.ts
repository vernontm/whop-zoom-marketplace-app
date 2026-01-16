// Multi-tenant Zoom signature generation
import { KJUR } from 'jsrsasign'
import { getCompanySdkCredentials } from './zoom-api-multi'

interface SignatureRequest {
  meetingNumber: string
  role: 0 | 1
}

/**
 * Generate Zoom SDK signature for a specific company
 * Matches the working signature format from the other app
 */
export async function generateZoomSignatureForCompany(
  companyId: string,
  { meetingNumber, role }: SignatureRequest
): Promise<string> {
  const credentials = await getCompanySdkCredentials(companyId)
  
  if (!credentials) {
    throw new Error('Zoom SDK credentials not configured. Please set up your Zoom integration in settings.')
  }

  const { sdkKey, sdkSecret } = credentials

  // Remove any spaces or dashes from meeting number
  const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, '')

  const iat = Math.round(Date.now() / 1000) - 30
  const exp = iat + 60 * 60 * 2 // 2 hours

  const oHeader = { alg: 'HS256', typ: 'JWT' }
  const oPayload = {
    sdkKey: sdkKey,
    appKey: sdkKey,
    mn: cleanMeetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp
  }
  
  console.log('Generating signature with:', { 
    sdkKey: sdkKey,
    sdkSecretFirst4: sdkSecret?.substring(0, 4),
    sdkSecretLast4: sdkSecret?.substring(sdkSecret.length - 4),
    sdkSecretLength: sdkSecret?.length,
    mn: cleanMeetingNumber, 
    role,
    iat,
    exp
  })

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  
  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret)
  
  console.log('Generated signature length:', signature.length)
  
  return signature
}

/**
 * Get the public SDK key for a company (safe to expose to client)
 */
export async function getPublicSdkKeyForCompany(companyId: string): Promise<string | null> {
  const credentials = await getCompanySdkCredentials(companyId)
  return credentials?.sdkKey || null
}
