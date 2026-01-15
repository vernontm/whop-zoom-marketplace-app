import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Decode JWT without verification (just to read payload)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const headersList = await headers()
  const whopUserToken = headersList.get('x-whop-user-token')
  const hasApiKey = !!process.env.WHOP_API_KEY
  
  let userId: string | null = null
  let whopApiResponse: unknown = null
  
  if (whopUserToken) {
    const payload = decodeJwtPayload(whopUserToken)
    if (payload && payload.sub) {
      userId = payload.sub as string
      
      // Try to fetch from Whop API
      if (hasApiKey) {
        try {
          const response = await fetch(`https://api.whop.com/api/v5/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            whopApiResponse = await response.json()
          } else {
            whopApiResponse = { error: response.status, text: await response.text() }
          }
        } catch (err) {
          whopApiResponse = { error: 'fetch_failed', message: String(err) }
        }
      }
    }
  }
  
  return NextResponse.json({
    hasWhopToken: !!whopUserToken,
    hasApiKey,
    userId,
    whopApiResponse
  })
}
