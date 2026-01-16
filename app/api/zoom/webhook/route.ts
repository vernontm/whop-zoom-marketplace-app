import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'
import { getCompanyZoomCredentials } from '@/lib/db'

// Get access token for a Zoom account
async function getAccessTokenForAccount(accountId: string): Promise<string | null> {
  if (!supabase) return null
  
  try {
    // Find company with this account_id
    const { data, error } = await supabase
      .from('company_zoom_settings')
      .select('company_id, client_id, client_secret, account_id')
      .eq('account_id', accountId)
      .single()
    
    if (error || !data) return null
    
    // Get access token using Server-to-Server OAuth
    const credentials = Buffer.from(`${data.client_id}:${data.client_secret}`).toString('base64')
    const tokenResponse = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${data.account_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    
    if (!tokenResponse.ok) return null
    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch {
    return null
  }
}

// Fetch meeting password from Zoom API
async function getMeetingPassword(accountId: string, meetingId: string): Promise<string> {
  try {
    const accessToken = await getAccessTokenForAccount(accountId)
    if (!accessToken) return ''
    
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) return ''
    
    const meeting = await response.json()
    
    // Try password field first, then extract from join_url
    if (meeting.password) return meeting.password
    if (meeting.join_url) {
      const match = meeting.join_url.match(/[?&]pwd=([^&]+)/)
      if (match) return match[1]
    }
    return ''
  } catch {
    return ''
  }
}

// Get webhook secret for an account from database
async function getWebhookSecretForAccount(accountId: string): Promise<string | null> {
  if (!supabase) return null
  
  try {
    const { data, error } = await supabase
      .from('company_zoom_settings')
      .select('webhook_secret_token')
      .eq('account_id', accountId)
      .single()
    
    if (error || !data) return null
    return data.webhook_secret_token
  } catch {
    return null
  }
}

// Get all webhook secrets for URL validation (since account_id isn't provided)
async function getAllWebhookSecrets(): Promise<string[]> {
  if (!supabase) return []
  
  try {
    const { data, error } = await supabase
      .from('company_zoom_settings')
      .select('webhook_secret_token')
      .not('webhook_secret_token', 'is', null)
    
    if (error || !data) return []
    return data.map(d => d.webhook_secret_token).filter(Boolean)
  } catch {
    return []
  }
}

// Try to validate with any stored secret (for URL validation where account_id isn't provided)
async function tryValidateWithAnySecret(plainToken: string): Promise<{ plainToken: string; encryptedToken: string } | null> {
  const secrets = await getAllWebhookSecrets()
  
  if (secrets.length === 0) {
    console.log('No webhook secrets stored yet')
    return null
  }
  
  // Use the first secret found - admin should save their secret before validating
  const secret = secrets[0]
  const encryptedToken = crypto.createHmac('sha256', secret).update(plainToken).digest('hex')
  
  return { plainToken, encryptedToken }
}

// Verify Zoom webhook signature with account-specific secret
function verifyZoomWebhook(payload: string, signature: string, timestamp: string, secret: string): boolean {
  if (!secret) {
    console.warn('No webhook secret found, skipping verification')
    return true
  }
  
  const message = `v0:${timestamp}:${payload}`
  const hashForVerify = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')
  
  const expectedSignature = `v0=${hashForVerify}`
  return signature === expectedSignature
}

// Handle Zoom URL validation challenge - needs secret from request context
function handleUrlValidation(plainToken: string, secret: string): { plainToken: string; encryptedToken: string } {
  // For URL validation, we need to use a default secret or skip encryption
  // Since we don't know which account this is for yet
  const encryptedToken = secret 
    ? crypto.createHmac('sha256', secret).update(plainToken).digest('hex')
    : plainToken
  
  return { plainToken, encryptedToken }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const body = JSON.parse(payload)
    
    console.log('Zoom webhook received:', body.event)
    
    const accountId = body.payload?.account_id || ''
    
    // Get webhook secret for this account
    const webhookSecret = await getWebhookSecretForAccount(accountId) || ''
    
    // Handle URL validation (required by Zoom when setting up webhooks)
    if (body.event === 'endpoint.url_validation') {
      console.log('Handling URL validation challenge')
      
      // URL validation doesn't include account_id, so try with any stored secret
      const response = await tryValidateWithAnySecret(body.payload.plainToken)
      
      if (response) {
        console.log('URL validation response generated successfully')
        return NextResponse.json(response)
      } else {
        // No secrets stored yet - tell admin to save secret first
        console.error('No webhook secrets stored - admin must save secret in Settings first')
        return NextResponse.json({ 
          error: 'Please save your Webhook Secret Token in Settings before validating' 
        }, { status: 400 })
      }
    }
    
    // Verify webhook signature for other events
    const signature = req.headers.get('x-zm-signature') || ''
    const timestamp = req.headers.get('x-zm-request-timestamp') || ''
    
    if (!verifyZoomWebhook(payload, signature, timestamp, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const event = body.event
    const meetingPayload = body.payload?.object
    
    if (!meetingPayload) {
      console.log('No meeting payload in webhook')
      return NextResponse.json({ received: true })
    }
    
    const meetingId = String(meetingPayload.id)
    const topic = meetingPayload.topic || 'Meeting'
    const hostId = meetingPayload.host_id
    
    console.log(`Meeting event: ${event}, ID: ${meetingId}, Account: ${accountId}`)
    
    // Handle meeting started
    if (event === 'meeting.started') {
      console.log(`Meeting ${meetingId} started`)
      
      // Fetch password from Zoom API (webhook doesn't include it)
      const password = await getMeetingPassword(accountId, meetingId)
      console.log(`Fetched password for meeting ${meetingId}: ${password ? 'found' : 'not found'}`)
      
      if (supabase) {
        // Upsert meeting status
        const { error } = await supabase
          .from('meeting_status')
          .upsert({
            meeting_id: meetingId,
            account_id: accountId,
            status: 'started',
            topic: topic,
            host_id: hostId,
            password: password,
            started_at: new Date().toISOString(),
            ended_at: null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'meeting_id'
          })
        
        if (error) {
          console.error('Error saving meeting status:', error)
        } else {
          console.log('Meeting status saved to database')
        }
      } else {
        console.log('Supabase not configured, cannot save meeting status')
      }
    }
    
    // Handle meeting ended
    if (event === 'meeting.ended') {
      console.log(`Meeting ${meetingId} ended`)
      
      if (supabase) {
        const { error } = await supabase
          .from('meeting_status')
          .upsert({
            meeting_id: meetingId,
            account_id: accountId,
            status: 'ended',
            topic: topic,
            host_id: hostId,
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'meeting_id'
          })
        
        if (error) {
          console.error('Error updating meeting status:', error)
        } else {
          console.log('Meeting status updated to ended')
        }
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Zoom also sends GET requests for validation
export async function GET() {
  return NextResponse.json({ status: 'Zoom webhook endpoint active' })
}
