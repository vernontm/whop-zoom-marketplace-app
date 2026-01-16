// Database utilities for multi-tenant Zoom credentials storage
// Uses Supabase for persistent storage

import { supabase, CompanyZoomSettings } from './supabase'

export interface NotificationSettings {
  startTitle: string
  startBody: string
  endTitle: string
  endBody: string
}

export interface ZoomCredentials {
  accountId: string
  clientId: string
  clientSecret: string
  sdkKey: string
  sdkSecret: string
  permanentMeetingId?: string
  defaultMeetingTitle?: string
  brandColor?: string
  webhookSecretToken?: string
  notificationSettings?: NotificationSettings
  updatedAt: string
}

export interface CompanySettings {
  companyId: string
  zoomCredentials?: ZoomCredentials
  adminUsernames: string[]
  createdAt: string
  updatedAt: string
}

// In-memory cache for credentials (reduces DB calls)
const credentialsCache = new Map<string, { data: ZoomCredentials; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minute cache

/**
 * Get Zoom credentials for a company
 * First checks cache, then Supabase, then env vars
 */
export async function getCompanyZoomCredentials(companyId: string): Promise<ZoomCredentials | null> {
  console.log('getCompanyZoomCredentials called for:', companyId)
  console.log('Supabase configured:', !!supabase)
  
  // Check cache first
  const cached = credentialsCache.get(companyId)
  if (cached && cached.expiresAt > Date.now()) {
    console.log('Returning cached credentials')
    return cached.data
  }

  // Try Supabase
  if (supabase) {
    try {
      console.log('Querying Supabase for company:', companyId)
      const { data, error } = await supabase
        .from('company_zoom_settings')
        .select('*')
        .eq('company_id', companyId)
        .single()

      console.log('Supabase response - data:', !!data, 'error:', error?.message)

      if (data && !error) {
        const credentials: ZoomCredentials = {
          accountId: data.account_id,
          clientId: data.client_id,
          clientSecret: data.client_secret,
          sdkKey: data.sdk_key,
          sdkSecret: data.sdk_secret,
          permanentMeetingId: data.permanent_meeting_id,
          defaultMeetingTitle: data.default_meeting_title || 'Meeting',
          brandColor: data.brand_color || '#5dc6ae',
          webhookSecretToken: data.webhook_secret_token,
          notificationSettings: data.notification_settings || undefined,
          updatedAt: data.updated_at
        }
        
        console.log('Found credentials in Supabase, accountId:', credentials.accountId?.substring(0, 4))
        
        // Cache the result
        credentialsCache.set(companyId, {
          data: credentials,
          expiresAt: Date.now() + CACHE_TTL
        })
        
        return credentials
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error)
    }
  } else {
    console.log('Supabase not configured, falling back to env vars')
  }

  // Fallback to environment variables
  console.log('Falling back to environment variables')
  return getEnvCredentials()
}

/**
 * Get credentials from environment variables (fallback/development)
 */
function getEnvCredentials(): ZoomCredentials | null {
  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  const sdkKey = process.env.ZOOM_SDK_KEY
  const sdkSecret = process.env.ZOOM_SDK_SECRET

  if (!accountId || !clientId || !clientSecret || !sdkKey || !sdkSecret) {
    return null
  }

  return {
    accountId,
    clientId,
    clientSecret,
    sdkKey,
    sdkSecret,
    permanentMeetingId: process.env.PERMANENT_MEETING_ID,
    defaultMeetingTitle: process.env.NEXT_PUBLIC_DEFAULT_MEETING_TITLE || 'Livestream',
    updatedAt: new Date().toISOString()
  }
}

/**
 * Save Zoom credentials for a company
 */
export async function saveCompanyZoomCredentials(
  companyId: string,
  credentials: Omit<ZoomCredentials, 'updatedAt'>
): Promise<boolean> {
  try {
    const settings = await getCompanySettings(companyId) || {
      companyId,
      adminUsernames: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    settings.zoomCredentials = {
      ...credentials,
      updatedAt: new Date().toISOString()
    }
    settings.updatedAt = new Date().toISOString()

    await saveCompanySettings(companyId, settings)

    // Invalidate cache
    credentialsCache.delete(companyId)

    return true
  } catch (error) {
    console.error('Error saving company credentials:', error)
    return false
  }
}

/**
 * Get full company settings from Supabase
 */
export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  if (!supabase) return null
  
  try {
    const { data, error } = await supabase
      .from('company_zoom_settings')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error || !data) return null

    return {
      companyId: data.company_id,
      zoomCredentials: {
        accountId: data.account_id,
        clientId: data.client_id,
        clientSecret: data.client_secret,
        sdkKey: data.sdk_key,
        sdkSecret: data.sdk_secret,
        permanentMeetingId: data.permanent_meeting_id,
        defaultMeetingTitle: data.default_meeting_title || 'Meeting',
        brandColor: data.brand_color || '#5dc6ae',
        webhookSecretToken: data.webhook_secret_token,
        notificationSettings: data.notification_settings || undefined,
        updatedAt: data.updated_at
      },
      adminUsernames: data.admin_usernames || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return null
  }
}

/**
 * Save company settings to Supabase
 */
export async function saveCompanySettings(companyId: string, settings: CompanySettings): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase not configured')
    return false
  }
  
  try {
    const dbRecord = {
      company_id: companyId,
      account_id: settings.zoomCredentials?.accountId,
      client_id: settings.zoomCredentials?.clientId,
      client_secret: settings.zoomCredentials?.clientSecret,
      sdk_key: settings.zoomCredentials?.sdkKey,
      sdk_secret: settings.zoomCredentials?.sdkSecret,
      permanent_meeting_id: settings.zoomCredentials?.permanentMeetingId?.replace(/\s/g, ''),
      default_meeting_title: settings.zoomCredentials?.defaultMeetingTitle || 'Livestream',
      brand_color: settings.zoomCredentials?.brandColor || '#5dc6ae',
      webhook_secret_token: settings.zoomCredentials?.webhookSecretToken,
      notification_settings: settings.zoomCredentials?.notificationSettings,
      admin_usernames: settings.adminUsernames || [],
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('company_zoom_settings')
      .upsert(dbRecord, { onConflict: 'company_id' })

    if (error) {
      console.error('Supabase upsert error:', error)
      return false
    }

    // Update cache
    if (settings.zoomCredentials) {
      credentialsCache.set(companyId, {
        data: settings.zoomCredentials,
        expiresAt: Date.now() + CACHE_TTL
      })
    }

    console.log('Settings saved for company:', companyId)
    return true
  } catch (error) {
    console.error('Error saving company settings:', error)
    return false
  }
}

/**
 * Delete company settings from Supabase
 */
export async function deleteCompanySettings(companyId: string): Promise<boolean> {
  if (!supabase) return false
  
  try {
    const { error } = await supabase
      .from('company_zoom_settings')
      .delete()
      .eq('company_id', companyId)

    // Invalidate cache
    credentialsCache.delete(companyId)

    return !error
  } catch (error) {
    console.error('Error deleting company settings:', error)
    return false
  }
}

/**
 * Check if a user is an admin for a company
 */
export async function isCompanyAdmin(companyId: string, username: string): Promise<boolean> {
  const settings = await getCompanySettings(companyId)
  if (!settings) {
    // Fallback to env-based admin check
    const envAdmins = (process.env.ADMIN_USERNAMES || '').split(',').map((u: string) => u.trim().toLowerCase()).filter(Boolean)
    return envAdmins.includes(username.toLowerCase())
  }
  return settings.adminUsernames.map((u: string) => u.toLowerCase()).includes(username.toLowerCase())
}

/**
 * Validate Zoom credentials by attempting to get an access token
 */
export async function validateZoomCredentials(credentials: ZoomCredentials): Promise<{ valid: boolean; error?: string }> {
  try {
    // Ensure credentials are trimmed
    const accountId = credentials.accountId?.trim()
    const clientId = credentials.clientId?.trim()
    const clientSecret = credentials.clientSecret?.trim()
    
    if (!accountId || !clientId || !clientSecret) {
      return { valid: false, error: 'Missing required credentials (Account ID, Client ID, or Client Secret)' }
    }
    
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    console.log('Validating Zoom credentials for account:', accountId.substring(0, 4) + '...', 'clientId:', clientId.substring(0, 4) + '...')
    
    // Use form body instead of query params for better compatibility
    const response = await fetch(
      'https://zoom.us/oauth/token',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Zoom validation failed:', response.status, errorText)
      
      // Parse error for better message
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error === 'invalid_request') {
          return { valid: false, error: 'Invalid credentials format. Make sure you are using Server-to-Server OAuth credentials from Zoom Marketplace.' }
        }
        if (errorJson.error === 'invalid_client') {
          return { valid: false, error: 'Invalid Client ID or Client Secret. Please verify your credentials.' }
        }
        return { valid: false, error: `Zoom API error: ${errorJson.reason || errorJson.error || errorText}` }
      } catch {
        return { valid: false, error: `Zoom API error (${response.status}): ${errorText}` }
      }
    }

    console.log('Zoom credentials validated successfully')
    return { valid: true }
  } catch (error) {
    console.error('Zoom validation error:', error)
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
