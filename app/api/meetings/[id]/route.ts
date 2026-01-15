import { NextRequest, NextResponse } from 'next/server'

// Legacy route - meetings are now managed via Zoom API directly
// This route is kept for backward compatibility but returns not configured

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Database not configured. Use multi-tenant Zoom API routes instead.' },
    { status: 503 }
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Database not configured. Use multi-tenant Zoom API routes instead.' },
    { status: 503 }
  )
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Database not configured. Use multi-tenant Zoom API routes instead.' },
    { status: 503 }
  )
}
