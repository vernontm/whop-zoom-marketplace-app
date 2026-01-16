import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { 
  getCompanyZoomCredentials, 
  saveCompanyZoomCredentials, 
  validateZoomCredentials,
  ZoomCredentials 
} from '@/lib/db'

// Get company ID from Whop headers or query params
async function getCompanyId(req?: NextRequest): Promise<string | null> {
  // First try query params (for client-side requests)
  if (req) {
    const url = new URL(req.url)
    const queryCompanyId = url.searchParams.get('companyId')
    if (queryCompanyId) return queryCompanyId
  }
  
  // Then try Whop headers
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
export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId(req)
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found. Make sure you are accessing this from a Whop app.' },
        { status: 401 }
      )
    }

    // Skip owner check if companyId came from query params (already authenticated via dashboard)
    const headersList = await headers()
    const hasWhopHeaders = !!headersList.get('x-whop-company-id')
    
    if (hasWhopHeaders) {
      const isOwner = await isCompanyOwner()
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only company owners can view settings' },
          { status: 403 }
        )
      }
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
      accountId: maskString(credentials.accountId),
      clientId: maskString(credentials.clientId),
      sdkKey: maskString(credentials.sdkKey),
      permanentMeetingId: credentials.permanentMeetingId || '',
      defaultMeetingTitle: credentials.defaultMeetingTitle || 'Meeting',
      brandColor: credentials.brandColor || '#5dc6ae',
      notificationSettings: credentials.notificationSettings || null,
      updatedAt: credentials.updatedAt
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
    const body = await req.json()
    
    // Get companyId from body or query params or headers
    let companyId = body.companyId
    if (!companyId) {
      const url = new URL(req.url)
      companyId = url.searchParams.get('companyId')
    }
    if (!companyId) {
      const headersList = await headers()
      companyId = headersList.get('x-whop-company-id')
    }
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID not found. Make sure you are accessing this from a Whop app.' },
        { status: 401 }
      )
    }

    // Skip owner check if companyId came from body/query (already authenticated via dashboard)
    const headersList2 = await headers()
    const hasWhopHeaders = !!headersList2.get('x-whop-company-id')
    
    if (hasWhopHeaders) {
      const isOwner = await isCompanyOwner()
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only company owners can update settings' },
          { status: 403 }
        )
      }
    }

    const { accountId, clientId, clientSecret, sdkKey, sdkSecret, permanentMeetingId, defaultMeetingTitle, brandColor, webhookSecretToken, notificationSettings, skipValidation } = body

    // Get existing credentials to merge with new values
    const existingCredentials = await getCompanyZoomCredentials(companyId)
    
    // For new setups, require all fields. For updates, merge with existing.
    const isNewSetup = !existingCredentials
    
    if (isNewSetup) {
      // Validate required fields for new setup
      if (!accountId || !clientId || !clientSecret || !sdkKey || !sdkSecret) {
        return NextResponse.json(
          { error: 'All Zoom credentials are required (Account ID, Client ID, Client Secret, SDK Key, SDK Secret)' },
          { status: 400 }
        )
      }
    }

    // Merge: use new value if provided, otherwise keep existing
    const credentials: Omit<ZoomCredentials, 'updatedAt'> = {
      accountId: accountId?.trim() || existingCredentials?.accountId || '',
      clientId: clientId?.trim() || existingCredentials?.clientId || '',
      clientSecret: clientSecret?.trim() || existingCredentials?.clientSecret || '',
      sdkKey: sdkKey?.trim() || existingCredentials?.sdkKey || '',
      sdkSecret: sdkSecret?.trim() || existingCredentials?.sdkSecret || '',
      permanentMeetingId: permanentMeetingId?.trim() || existingCredentials?.permanentMeetingId || undefined,
      defaultMeetingTitle: defaultMeetingTitle?.trim() || existingCredentials?.defaultMeetingTitle || 'Meeting',
      brandColor: brandColor?.trim() || existingCredentials?.brandColor || '#5dc6ae',
      webhookSecretToken: webhookSecretToken?.trim() || existingCredentials?.webhookSecretToken || undefined,
      notificationSettings: notificationSettings || existingCredentials?.notificationSettings || undefined
    }

    // Validate that we have all required fields after merge
    if (!credentials.accountId || !credentials.clientId || !credentials.clientSecret || !credentials.sdkKey || !credentials.sdkSecret) {
      return NextResponse.json(
        { error: 'All Zoom credentials are required (Account ID, Client ID, Client Secret, SDK Key, SDK Secret)' },
        { status: 400 }
      )
    }

    // Validate credentials with Zoom API (unless skipped or only updating non-API fields)
    const onlyUpdatingNonApiFields = !accountId && !clientId && !clientSecret && existingCredentials
    if (!skipValidation && !onlyUpdatingNonApiFields) {
      const validation = await validateZoomCredentials(credentials as ZoomCredentials)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid Zoom credentials: ${validation.error}` },
          { status: 400 }
        )
      }
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
