import { hasAccess, authorizedUserOn } from '@whop-apps/sdk'

// Check if user has access to a resource (experience, product, or company)
export async function checkAccess(resourceId: string): Promise<boolean> {
  try {
    const access = await hasAccess({ to: resourceId })
    return access
  } catch (error) {
    console.error('Error checking access:', error)
    return false
  }
}

// Check if user is authorized on a company (admin/owner)
export async function isAuthorizedOnCompany(companyId: string): Promise<boolean> {
  try {
    const access = await hasAccess({ to: authorizedUserOn(companyId) })
    return access
  } catch (error) {
    console.error('Error checking company authorization:', error)
    return false
  }
}

export { hasAccess, authorizedUserOn }
