// Multi-tenant Zoom signature generation
import jwt from 'jsonwebtoken'
import { getCompanySdkCredentials } from './zoom-api-multi'

interface SignatureRequest {
  meetingNumber: string
  role: 0 | 1
}

/**
 * Generate Zoom SDK signature for a specific company
 * Using jsonwebtoken library for reliable JWT generation
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

  const payload = {
    appKey: sdkKey,
    sdkKey: sdkKey,
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

  // Use jsonwebtoken for reliable signing
  const signature = jwt.sign(payload, sdkSecret, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  })
  
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
