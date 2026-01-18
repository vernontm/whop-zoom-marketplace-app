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

// Check if user has access to a company/product (for paid access gating)
export async function checkUserAccessLevel(
  resourceId: string,
  userId: string
): Promise<{ hasAccess: boolean; isAdmin: boolean }> {
  try {
    // Only call checkAccess if resourceId is a valid resource tag (biz_, prod_, or exp_)
    if (!resourceId || (!resourceId.startsWith('biz_') && !resourceId.startsWith('prod_') && !resourceId.startsWith('exp_'))) {
      console.log('Invalid resource tag for checkAccess:', resourceId)
      return { hasAccess: false, isAdmin: false }
    }
    
    const sdk = getWhopSdk()
    const access = await sdk.users.checkAccess(resourceId, { id: userId })
    
    console.log('Access check result:', { 
      resourceId, 
      userId, 
      hasAccess: access.has_access, 
      accessLevel: access.access_level 
    })
    
    // access_level can be 'no_access' or 'customer' - admin check done separately via headers
    return {
      hasAccess: access.has_access ?? false,
      isAdmin: false // Admin status determined by Whop headers, not this API
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

// Get company ID from an experience ID
export async function getCompanyIdFromExperience(experienceId: string): Promise<string | null> {
  // If it's already a company ID, return it
  if (experienceId.startsWith('biz_')) {
    return experienceId
  }
  
  // If it's not an experience ID, return null
  if (!experienceId.startsWith('exp_')) {
    console.log('Not an experience ID:', experienceId)
    return null
  }
  
  try {
    const sdk = getWhopSdk()
    // Fetch the experience to get its company_id
    const experience = await sdk.experiences.retrieve(experienceId)
    const companyId = typeof experience.company === 'string' ? experience.company : experience.company?.id
    console.log('Experience retrieved:', { id: experience.id, companyId })
    return companyId || null
  } catch (error) {
    console.error('Error fetching experience:', error)
    return null
  }
}

// Send push notification to users subscribed to an experience
export async function sendPushNotification(
  experienceId: string,
  title: string,
  body: string
): Promise<boolean> {
  try {
    const sdk = getWhopSdk()
    
    // Use the SDK's notifications.create method
    // experienceId can be exp_ or biz_ prefixed
    const isCompany = experienceId.startsWith('biz_')
    
    const result = await sdk.notifications.create(
      isCompany 
        ? { company_id: experienceId, title, content: body }
        : { experience_id: experienceId, title, content: body }
    )

    if (result.success) {
      console.log('Push notification sent successfully')
      return true
    } else {
      console.error('Failed to send push notification')
      return false
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}
