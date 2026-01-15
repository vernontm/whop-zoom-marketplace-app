import { Whop } from '@whop/sdk'

// Initialize Whop SDK with app credentials
export const whopsdk = new Whop({
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  apiKey: process.env.WHOP_API_KEY,
})

// Check if user has admin access to a company
export async function checkUserAccessLevel(
  companyId: string,
  userId: string
): Promise<{ hasAccess: boolean; isAdmin: boolean }> {
  try {
    const access = await whopsdk.users.checkAccess(companyId, { id: userId })
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
    const result = await whopsdk.verifyUserToken(headersList)
    return { userId: result.userId }
  } catch (error) {
    console.error('Error verifying user token:', error)
    return { userId: null }
  }
}
