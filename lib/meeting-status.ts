import { supabase } from './supabase'
import { getCompanyZoomCredentials } from './db'

export interface MeetingStatus {
  meetingId: string
  accountId: string
  status: 'started' | 'ended' | 'waiting'
  topic: string
  hostId?: string
  password?: string
  startedAt?: string
  endedAt?: string
}

/**
 * Get live meeting status from database (populated by webhooks)
 */
export async function getLiveMeetingFromDatabase(
  companyId: string
): Promise<{ id: string; topic: string; password?: string } | null> {
  // Get credentials to find the account ID and permanent meeting ID
  const credentials = await getCompanyZoomCredentials(companyId)
  
  if (!credentials) {
    console.log('No credentials found for company:', companyId)
    return null
  }
  
  if (!supabase) {
    console.log('Supabase not configured, cannot check meeting status from database')
    return null
  }
  
  const permanentMeetingId = credentials.permanentMeetingId
  const accountId = credentials.accountId
  
  console.log('Checking for live meeting - permanentMeetingId:', permanentMeetingId, 'accountId:', accountId)
  
  try {
    // First try: Check by permanent meeting ID if configured
    if (permanentMeetingId) {
      const { data, error } = await supabase
        .from('meeting_status')
        .select('*')
        .eq('meeting_id', permanentMeetingId)
        .eq('status', 'started')
        .single()
      
      if (!error && data) {
        console.log('Found live meeting by meeting_id:', data.meeting_id)
        return {
          id: data.meeting_id,
          topic: data.topic || credentials.defaultMeetingTitle || 'Meeting',
          password: data.password || ''
        }
      }
    }
    
    // Second try: Check by account ID for any started meeting
    if (accountId) {
      const { data, error } = await supabase
        .from('meeting_status')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'started')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!error && data) {
        console.log('Found live meeting by account_id:', data.meeting_id)
        return {
          id: data.meeting_id,
          topic: data.topic || credentials.defaultMeetingTitle || 'Meeting',
          password: data.password || ''
        }
      }
    }
    
    console.log('No live meeting found in database')
    return null
  } catch (err) {
    console.error('Error querying meeting status:', err)
    return null
  }
}

/**
 * Update meeting status in database (called by webhook)
 */
export async function updateMeetingStatus(
  meetingId: string,
  accountId: string,
  status: 'started' | 'ended',
  topic?: string,
  password?: string
): Promise<boolean> {
  if (!supabase) {
    console.log('Supabase not configured')
    return false
  }
  
  try {
    const { error } = await supabase
      .from('meeting_status')
      .upsert({
        meeting_id: meetingId,
        account_id: accountId,
        status,
        topic: topic || 'Meeting',
        password: password || '',
        started_at: status === 'started' ? new Date().toISOString() : undefined,
        ended_at: status === 'ended' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'meeting_id'
      })
    
    if (error) {
      console.error('Error updating meeting status:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error in updateMeetingStatus:', err)
    return false
  }
}
