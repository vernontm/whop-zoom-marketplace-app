// Multi-tenant Zoom API integration
// Uses per-company credentials from the database

import { getCompanyZoomCredentials, ZoomCredentials } from './db'

interface ZoomTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ZoomMeetingResponse {
  id: number
  topic: string
  password: string
  join_url: string
  start_url: string
}

// Per-company token cache
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

/**
 * Get Zoom access token for a specific company
 */
async function getZoomAccessToken(companyId: string): Promise<string> {
  // Check cache first
  const cached = tokenCache.get(companyId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  const credentials = await getCompanyZoomCredentials(companyId)
  if (!credentials) {
    throw new Error('Zoom credentials not configured. Please set up your Zoom integration in settings.')
  }

  const basicAuth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${credentials.accountId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Zoom access token: ${error}`)
  }

  const data: ZoomTokenResponse = await response.json()
  
  // Cache the token (expire 5 minutes early)
  tokenCache.set(companyId, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  })

  return data.access_token
}

/**
 * Get SDK credentials for a company (for client-side signature generation)
 */
export async function getCompanySdkCredentials(companyId: string): Promise<{ sdkKey: string; sdkSecret: string } | null> {
  const credentials = await getCompanyZoomCredentials(companyId)
  if (!credentials) return null
  
  console.log('SDK credentials for company:', companyId, {
    sdkKey: credentials.sdkKey,
    sdkKeyLength: credentials.sdkKey?.length,
    sdkSecretFirst4: credentials.sdkSecret?.substring(0, 4),
    sdkSecretLength: credentials.sdkSecret?.length,
    hasSdkSecret: !!credentials.sdkSecret
  })
  
  return {
    sdkKey: credentials.sdkKey,
    sdkSecret: credentials.sdkSecret
  }
}

/**
 * Create an instant meeting for a company
 */
export async function createInstantMeetingForCompany(
  companyId: string, 
  topic: string
): Promise<ZoomMeetingResponse> {
  const accessToken = await getZoomAccessToken(companyId)

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting (can be joined immediately)
      start_time: new Date().toISOString(),
      duration: 120,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: false,
        audio: 'both',
        auto_recording: 'none'
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Zoom API error:', error)
    throw new Error(`Failed to create Zoom meeting: ${error}`)
  }

  return response.json()
}

/**
 * End a meeting for a company
 */
export async function endMeetingForCompany(companyId: string, meetingId: string): Promise<void> {
  const accessToken = await getZoomAccessToken(companyId)

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'end' })
  })

  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(`Failed to end Zoom meeting: ${error}`)
  }
}

/**
 * Get live meeting for a company
 * First checks if the permanent meeting is in "started" status, then falls back to listing live meetings
 */
export async function getLiveMeetingForCompany(
  companyId: string
): Promise<{ id: string; topic: string; password?: string } | null> {
  console.log('getLiveMeetingForCompany called with:', companyId)
  
  const credentials = await getCompanyZoomCredentials(companyId)
  console.log('Credentials found:', credentials ? 'yes' : 'no', credentials?.accountId?.substring(0, 4))
  
  if (!credentials) {
    console.log('No credentials found for company:', companyId)
    return null
  }

  const accessToken = await getZoomAccessToken(companyId)
  console.log('Got access token:', accessToken ? 'yes' : 'no')
  const permanentMeetingId = credentials.permanentMeetingId
  console.log('Permanent meeting ID:', permanentMeetingId)

  try {
    // If we have a permanent meeting ID, check its status directly first
    if (permanentMeetingId) {
      console.log('Checking permanent meeting status directly...')
      const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${permanentMeetingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (meetingResponse.ok) {
        const meetingData = await meetingResponse.json()
        console.log('Permanent meeting status:', meetingData.status, 'topic:', meetingData.topic)
        
        // If meeting is in "started" status, it's live
        if (meetingData.status === 'started') {
          console.log('Permanent meeting is LIVE!')
          return {
            id: permanentMeetingId,
            topic: meetingData.topic || credentials.defaultMeetingTitle || 'Meeting',
            password: meetingData.password || meetingData.encrypted_password || ''
          }
        }
      } else {
        console.log('Failed to get permanent meeting status:', meetingResponse.status)
      }
    }

    // Fallback: try /users/me/meetings?type=live
    console.log('Fetching live meetings from /users/me...')
    const liveResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Live meetings response status:', liveResponse.status)

    if (liveResponse.ok) {
      const liveData = await liveResponse.json()
      const liveMeetings = liveData.meetings || []
      console.log('Live meetings count:', liveMeetings.length)
      
      if (liveMeetings.length > 0) {
        console.log('Live meetings:', JSON.stringify(liveMeetings.map((m: {id: number, topic: string}) => ({id: m.id, topic: m.topic}))))

        // If permanent meeting ID is set, check if it's in the live list
        if (permanentMeetingId) {
          const permanentMeeting = liveMeetings.find(
            (m: { id: number }) => String(m.id) === permanentMeetingId
          )
          if (permanentMeeting) {
            console.log('Found permanent meeting in live list!')
            return {
              id: permanentMeetingId,
              topic: permanentMeeting.topic || credentials.defaultMeetingTitle || 'Livestream',
              password: extractPassword(permanentMeeting)
            }
          }
        }

        // Return first live meeting
        const meeting = liveMeetings[0]
        console.log('Returning first live meeting:', meeting.id)
        return {
          id: String(meeting.id),
          topic: meeting.topic,
          password: extractPassword(meeting)
        }
      }
    } else {
      const errorText = await liveResponse.text()
      console.log('/users/me failed:', liveResponse.status, errorText)
    }

    // Fallback: Check all users in the account
    console.log('Checking all users in account...')
    const usersResponse = await fetch('https://api.zoom.us/v2/users?status=active&page_size=30', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (usersResponse.ok) {
      const usersData = await usersResponse.json()
      const users = usersData.users || []
      console.log('Found users:', users.length)

      for (const user of users) {
        const userLiveResponse = await fetch(
          `https://api.zoom.us/v2/users/${user.id}/meetings?type=live`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (userLiveResponse.ok) {
          const userLiveData = await userLiveResponse.json()
          const userLiveMeetings = userLiveData.meetings || []
          
          if (userLiveMeetings.length > 0) {
            console.log(`User ${user.id} has ${userLiveMeetings.length} live meetings`)

            // Check for permanent meeting
            if (permanentMeetingId) {
              const permanentMeeting = userLiveMeetings.find(
                (m: { id: number }) => String(m.id) === permanentMeetingId
              )
              if (permanentMeeting) {
                console.log('Found permanent meeting for user:', user.id)
                return {
                  id: permanentMeetingId,
                  topic: permanentMeeting.topic || credentials.defaultMeetingTitle || 'Livestream',
                  password: extractPassword(permanentMeeting)
                }
              }
            }

            // Return any live meeting
            const meeting = userLiveMeetings[0]
            return {
              id: String(meeting.id),
              topic: meeting.topic,
              password: extractPassword(meeting)
            }
          }
        }
      }
    } else {
      console.log('Failed to fetch users:', usersResponse.status)
    }
  } catch (err) {
    console.error('Error checking for live meeting:', err)
  }

  console.log('No live meeting found')
  return null
}

/**
 * End all live meetings for a company
 */
export async function endAllLiveMeetingsForCompany(companyId: string): Promise<void> {
  const accessToken = await getZoomAccessToken(companyId)

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    console.error('Failed to get live meetings')
    return
  }

  const data = await response.json()
  const liveMeetings = data.meetings || []

  for (const meeting of liveMeetings) {
    try {
      await endMeetingForCompany(companyId, String(meeting.id))
      console.log(`Ended meeting: ${meeting.id}`)
    } catch (err) {
      console.error(`Failed to end meeting ${meeting.id}:`, err)
    }
  }
}

/**
 * Get meeting status for a company
 */
export async function getMeetingStatusForCompany(
  companyId: string,
  meetingId: string
): Promise<'waiting' | 'started' | 'ended' | 'notfound'> {
  const accessToken = await getZoomAccessToken(companyId)

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.status === 404) return 'notfound'
  if (!response.ok) return 'notfound'

  const data = await response.json()
  return data.status || 'waiting'
}

/**
 * Get default meeting title for a company
 */
export async function getDefaultMeetingTitleForCompany(companyId: string): Promise<string> {
  const credentials = await getCompanyZoomCredentials(companyId)
  const baseTitle = credentials?.defaultMeetingTitle || 'Livestream'
  
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  
  return `${baseTitle} ${month}-${day}-${year}`
}

// Helper to extract password from meeting object
function extractPassword(meeting: { password?: string; join_url?: string }): string {
  if (meeting.password) return meeting.password
  if (meeting.join_url) {
    const match = meeting.join_url.match(/[?&]pwd=([^&]+)/)
    if (match) return match[1]
  }
  return ''
}

/**
 * Invalidate token cache for a company (call after credentials update)
 */
export function invalidateTokenCache(companyId: string): void {
  tokenCache.delete(companyId)
}
