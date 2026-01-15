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
