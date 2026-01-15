import { WhopAPI, authorizedUserOn, hasAccess } from '@whop-apps/sdk'
import { headers } from 'next/headers'

// Get the current user from Whop headers
export async function getCurrentUser() {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-whop-user-id')
    const username = headersList.get('x-whop-username')
    const email = headersList.get('x-whop-user-email')
    
    if (!userId) return null
    
    return {
      id: userId,
      username: username || 'Unknown',
      email: email || ''
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Check if user has access to the experience
export async function checkUserAccess(experienceId: string) {
  try {
    const access = await hasAccess({ to: experienceId })
    return access
  } catch (error) {
    console.error('Error checking access:', error)
    return false
  }
}

// Get authorized user for a specific resource
export async function getAuthorizedUser(experienceId: string) {
  try {
    const user = await authorizedUserOn(experienceId)
    return user
  } catch (error) {
    console.error('Error getting authorized user:', error)
    return null
  }
}
