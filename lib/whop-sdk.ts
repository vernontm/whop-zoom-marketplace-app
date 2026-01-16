import { Whop } from '@whop/sdk'

// Lazy initialization of Whop SDK to avoid build-time errors
let _whopsdk: Whop | null = null

function getWhopSdk(): Whop {
  if (!_whopsdk) {
    _whopsdk = new Whop({
      appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      apiKey: process.env.WHOP_API_KEY,
    })
  }
  return _whopsdk
}

// Export getter for SDK
export const whopsdk = {
  get verifyUserToken() {
    return getWhopSdk().verifyUserToken.bind(getWhopSdk())
  },
  get users() {
    return getWhopSdk().users
  },
  get companies() {
    return getWhopSdk().companies
  }
}

// Check if user has admin access to a company
export async function checkUserAccessLevel(
  companyId: string,
  userId: string
): Promise<{ hasAccess: boolean; isAdmin: boolean }> {
  try {
    // Only call checkAccess if companyId is a valid resource tag (biz_, prod_, or exp_)
    if (!companyId || (!companyId.startsWith('biz_') && !companyId.startsWith('prod_') && !companyId.startsWith('exp_'))) {
      console.log('Invalid resource tag for checkAccess:', companyId)
      return { hasAccess: false, isAdmin: false }
    }
    
    const sdk = getWhopSdk()
    const access = await sdk.users.checkAccess(companyId, { id: userId })
    return {
      hasAccess: access.has_access ?? false,
      isAdmin: access.access_level === 'admin'
    }
  } catch (error) {
    console.error('Error checking access:', error)
    return { hasAccess: false, isAdmin: false }
  }
}

// Verify user token and get userId from headers
export async function verifyUserToken(headersList: Headers): Promise<{ userId: string | null }> {
  try {
    const sdk = getWhopSdk()
    const result = await sdk.verifyUserToken(headersList)
    return { userId: result.userId }
  } catch (error) {
    console.error('Error verifying user token:', error)
    return { userId: null }
  }
}

// Send push notification to users subscribed to an experience
export async function sendPushNotification(
  experienceId: string,
  title: string,
  body: string
): Promise<boolean> {
  try {
    const apiKey = process.env.WHOP_API_KEY
    if (!apiKey) {
      console.error('WHOP_API_KEY not configured')
      return false
    }

    const response = await fetch('https://api.whop.com/api/v5/notifications/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        experience_id: experienceId,
        title,
        body
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to send push notification:', response.status, errorText)
      return false
    }

    console.log('Push notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}
