// Database utilities for multi-tenant Zoom credentials storage
// Uses Whop's built-in key-value store for app data

export interface ZoomCredentials {
  accountId: string
  clientId: string
  clientSecret: string
  sdkKey: string
  sdkSecret: string
  permanentMeetingId?: string
  defaultMeetingTitle?: string
  updatedAt: string
}

export interface CompanySettings {
  companyId: string
  zoomCredentials?: ZoomCredentials
  adminUsernames: string[]
  createdAt: string
  updatedAt: string
}

// In-memory cache for credentials (per-request)
const credentialsCache = new Map<string, { data: ZoomCredentials; expiresAt: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute cache

// Key prefix for storing company settings
const SETTINGS_KEY_PREFIX = 'zoom_settings_'

/**
 * Get Zoom credentials for a specific company
 */
export async function getCompanyZoomCredentials(companyId: string): Promise<ZoomCredentials | null> {
  // Check cache first
  const cached = credentialsCache.get(companyId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  try {
    // Try to get from Whop app data store
    const settings = await getCompanySettings(companyId)
    if (settings?.zoomCredentials) {
      // Cache the result
      credentialsCache.set(companyId, {
        data: settings.zoomCredentials,
        expiresAt: Date.now() + CACHE_TTL
      })
      return settings.zoomCredentials
    }
  } catch (error) {
    console.error('Error fetching company credentials:', error)
  }

  // Fallback to environment variables for backward compatibility
  const envCredentials = getEnvCredentials()
  if (envCredentials) {
    return envCredentials
  }

  return null
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
 * Get full company settings
 */
export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  try {
    // Use Whop's app data API to store settings
    const response = await fetch(`https://api.whop.com/api/v5/apps/data/${SETTINGS_KEY_PREFIX}${companyId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch settings: ${response.status}`)
    }

    const data = await response.json()
    return data.value as CompanySettings
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return null
  }
}

/**
 * Save company settings
 */
export async function saveCompanySettings(companyId: string, settings: CompanySettings): Promise<boolean> {
  try {
    const response = await fetch(`https://api.whop.com/api/v5/apps/data/${SETTINGS_KEY_PREFIX}${companyId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: settings })
    })

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Error saving company settings:', error)
    return false
  }
}

/**
 * Delete company settings (for uninstall)
 */
export async function deleteCompanySettings(companyId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.whop.com/api/v5/apps/data/${SETTINGS_KEY_PREFIX}${companyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`
      }
    })

    // Invalidate cache
    credentialsCache.delete(companyId)

    return response.ok || response.status === 404
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
      return { valid: false, error: `Invalid API credentials: ${error}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
