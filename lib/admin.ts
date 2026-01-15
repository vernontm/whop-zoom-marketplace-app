// Admin utilities

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').map(u => u.trim().toLowerCase()).filter(Boolean)

export function isAdmin(username: string): boolean {
  return ADMIN_USERNAMES.includes(username.toLowerCase())
}

export function isAdminById(userId: string): boolean {
  // Fallback for user ID check if needed
  const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean)
  return ADMIN_USER_IDS.includes(userId)
}

export function getDefaultMeetingTitle(): string {
  const baseTitle = process.env.NEXT_PUBLIC_DEFAULT_MEETING_TITLE || 'Livestream'
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  
  return `${baseTitle} ${month}-${day}-${year}`
}

export function formatMeetingDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${month}-${day}-${year}`
}
