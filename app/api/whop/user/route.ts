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

// Fetch user info from Whop API
async function getWhopUser(userId: string): Promise<{ username: string; email: string } | null> {
  const apiKey = process.env.WHOP_API_KEY
  if (!apiKey) return null
  
  try {
    const response = await fetch(`https://api.whop.com/api/v5/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error('Whop API error:', response.status)
      return null
    }
    
    const data = await response.json()
    return {
      username: data.username || data.name || userId,
      email: data.email || ''
    }
  } catch (err) {
    console.error('Failed to fetch Whop user:', err)
    return null
  }
}

export async function GET(req: NextRequest) {
  const headersList = await headers()
  const whopUserToken = headersList.get('x-whop-user-token')
  
  if (!whopUserToken) {
    return NextResponse.json({ username: null, error: 'No Whop token' })
  }
  
  const payload = decodeJwtPayload(whopUserToken)
  if (!payload || !payload.sub) {
    return NextResponse.json({ username: null, error: 'Invalid token' })
  }
  
  const userId = payload.sub as string
  const whopUser = await getWhopUser(userId)
  
  if (!whopUser) {
    return NextResponse.json({ username: null, error: 'Failed to fetch user' })
  }
  
  return NextResponse.json({ username: whopUser.username, email: whopUser.email })
}
