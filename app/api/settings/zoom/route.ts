import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { 
  getCompanyZoomCredentials, 
  saveCompanyZoomCredentials, 
  validateZoomCredentials,
  ZoomCredentials 
} from '@/lib/db'

// Get company ID from Whop headers
async function getCompanyId(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-whop-company-id')
}

// Check if user is company owner/admin
async function isCompanyOwner(): Promise<boolean> {
  const headersList = await headers()
  const isAdmin = headersList.get('x-whop-is-admin')
  return isAdmin === 'true'
}

// GET - Retrieve current Zoom credentials (masked)
export async function GET() {
  try {
    const companyId = await getCompanyId()
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found. Make sure you are accessing this from a Whop app.' },
        { status: 401 }
      )
    }

    const isOwner = await isCompanyOwner()
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only company owners can view settings' },
        { status: 403 }
      )
    }

    const credentials = await getCompanyZoomCredentials(companyId)
    
    if (!credentials) {
      return NextResponse.json({
        configured: false,
        credentials: null
      })
    }

    // Return masked credentials for display
    return NextResponse.json({
      configured: true,
      credentials: {
        accountId: maskString(credentials.accountId),
        clientId: maskString(credentials.clientId),
        clientSecret: '••••••••••••',
        sdkKey: maskString(credentials.sdkKey),
        sdkSecret: '••••••••••••',
        permanentMeetingId: credentials.permanentMeetingId || '',
        defaultMeetingTitle: credentials.defaultMeetingTitle || 'Livestream',
        updatedAt: credentials.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching Zoom settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Save new Zoom credentials
export async function POST(req: NextRequest) {
  try {
    const companyId = await getCompanyId()
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found. Make sure you are accessing this from a Whop app.' },
        { status: 401 }
      )
    }

    const isOwner = await isCompanyOwner()
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only company owners can update settings' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { accountId, clientId, clientSecret, sdkKey, sdkSecret, permanentMeetingId, defaultMeetingTitle } = body

    // Validate required fields
    if (!accountId || !clientId || !clientSecret || !sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: 'All Zoom credentials are required (Account ID, Client ID, Client Secret, SDK Key, SDK Secret)' },
        { status: 400 }
      )
    }

    const credentials: Omit<ZoomCredentials, 'updatedAt'> = {
      accountId: accountId.trim(),
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      sdkKey: sdkKey.trim(),
      sdkSecret: sdkSecret.trim(),
      permanentMeetingId: permanentMeetingId?.trim() || undefined,
      defaultMeetingTitle: defaultMeetingTitle?.trim() || 'Livestream'
    }

    // Validate credentials with Zoom API
    const validation = await validateZoomCredentials(credentials as ZoomCredentials)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid Zoom credentials: ${validation.error}` },
        { status: 400 }
      )
    }

    // Save credentials
    const saved = await saveCompanyZoomCredentials(companyId, credentials)
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save credentials' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Zoom credentials saved successfully'
    })
  } catch (error) {
    console.error('Error saving Zoom settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// Helper to mask sensitive strings
function maskString(str: string): string {
  if (!str || str.length < 8) return '••••••••'
  return str.substring(0, 4) + '••••' + str.substring(str.length - 4)
}
