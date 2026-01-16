import { NextResponse } from 'next/server'
import { getCompanyZoomCredentials } from '@/lib/db'

// Get access token for a company
async function getAccessToken(companyId: string): Promise<string> {
  const credentials = await getCompanyZoomCredentials(companyId)
  if (!credentials) throw new Error('No credentials')
  
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${credentials.accountId}`
  const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token error: ${error}`)
  }
  
  const data = await response.json()
  return data.access_token
}

interface RouteParams {
  params: Promise<{ companyId: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { companyId } = await params
    
    // Get credentials
    const credentials = await getCompanyZoomCredentials(companyId)
    
    if (!credentials) {
      return NextResponse.json({
        error: 'No credentials found',
        companyId
      })
    }
    
    const permanentMeetingId = credentials.permanentMeetingId
    
    if (!permanentMeetingId) {
      return NextResponse.json({
        error: 'No permanent meeting ID configured',
        companyId,
        hasCredentials: true
      })
    }
    
    // Get access token
    const accessToken = await getAccessToken(companyId)
    
    // Check meeting status directly
    const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${permanentMeetingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    const meetingData = await meetingResponse.json()
    
    // Also check live meetings list
    const liveResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    const liveData = await liveResponse.json()
    
    return NextResponse.json({
      companyId,
      permanentMeetingId,
      meetingStatus: meetingResponse.ok ? meetingData.status : 'error',
      meetingTopic: meetingResponse.ok ? meetingData.topic : null,
      meetingError: !meetingResponse.ok ? meetingData : null,
      liveMeetingsCount: liveData.meetings?.length || 0,
      liveMeetings: liveData.meetings?.map((m: { id: number; topic: string; status: string }) => ({
        id: m.id,
        topic: m.topic,
        status: m.status
      })) || [],
      rawMeetingResponse: meetingData
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
