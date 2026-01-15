import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  const headersList = await headers()
  
  // Get all headers
  const allHeaders: Record<string, string> = {}
  headersList.forEach((value, key) => {
    allHeaders[key] = value
  })
  
  // Filter for whop-related headers
  const whopHeaders: Record<string, string> = {}
  Object.entries(allHeaders).forEach(([key, value]) => {
    if (key.toLowerCase().includes('whop') || key.toLowerCase().includes('x-')) {
      whopHeaders[key] = value
    }
  })
  
  return NextResponse.json({
    whopHeaders,
    allHeaders
  }, { status: 200 })
}
