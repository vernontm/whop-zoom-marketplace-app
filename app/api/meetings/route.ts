import { NextRequest, NextResponse } from 'next/server'

// Legacy route - meetings are now managed via Zoom API directly
// This route is kept for backward compatibility but returns not configured

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'Database not configured. Use multi-tenant Zoom API routes instead.', meetings: [] },
    { status: 503 }
  )
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Database not configured. Use /api/zoom/create-meeting/[companyId] instead.' },
    { status: 503 }
  )
}
