import { NextResponse } from 'next/server'

// This route requires a companyId - redirect to the dynamic route
export async function GET() {
  return NextResponse.json({
    error: 'Company ID required. Use /api/zoom/live-meeting/[companyId] instead.',
    live: false,
    meeting: null
  }, { status: 400 })
}
