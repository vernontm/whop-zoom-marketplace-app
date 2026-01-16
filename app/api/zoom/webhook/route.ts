import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

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
      console.log('Handling URL validation challenge for account:', accountId)
      const response = handleUrlValidation(body.payload.plainToken, webhookSecret)
      return NextResponse.json(response)
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
    const password = meetingPayload.password || ''
    
    console.log(`Meeting event: ${event}, ID: ${meetingId}, Account: ${accountId}`)
    
    // Handle meeting started
    if (event === 'meeting.started') {
      console.log(`Meeting ${meetingId} started`)
      
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
