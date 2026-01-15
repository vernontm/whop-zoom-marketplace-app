import { NextResponse } from 'next/server'

export async function GET() {
  // Check if Zoom credentials are configured
  const hasAccountId = !!process.env.ZOOM_ACCOUNT_ID
  const hasClientId = !!process.env.ZOOM_CLIENT_ID
  const hasClientSecret = !!process.env.ZOOM_CLIENT_SECRET
  
  // Try to get an access token
  let tokenStatus = 'not_attempted'
  let liveMeetingsResponse = null
  
  if (hasAccountId && hasClientId && hasClientSecret) {
    try {
      const credentials = Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
      ).toString('base64')

      const tokenResponse = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      if (tokenResponse.ok) {
        tokenStatus = 'success'
        const tokenData = await tokenResponse.json()
        
        // Get all users in the account to see which account we're connected to
        const usersResponse = await fetch('https://api.zoom.us/v2/users?status=active&page_size=30', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        let userInfo = null
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const users = usersData.users || []
          userInfo = {
            totalUsers: users.length,
            users: users.map((u: { email: string; first_name: string; last_name: string; id: string }) => ({ 
              email: u.email, 
              name: `${u.first_name} ${u.last_name}`,
              id: u.id 
            }))
          }
        }
        
        // Try to get live meetings
        const meetingsResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        // Also get scheduled meetings
        const scheduledResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=scheduled', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        let scheduledMeetings = null
        if (scheduledResponse.ok) {
          scheduledMeetings = await scheduledResponse.json()
        }
        
        if (meetingsResponse.ok) {
          liveMeetingsResponse = await meetingsResponse.json()
          liveMeetingsResponse.userInfo = userInfo
          liveMeetingsResponse.scheduledMeetings = scheduledMeetings?.meetings?.length || 0
        } else {
          liveMeetingsResponse = { error: await meetingsResponse.text(), status: meetingsResponse.status, userInfo }
        }
      } else {
        tokenStatus = `failed: ${tokenResponse.status}`
      }
    } catch (error) {
      tokenStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`
    }
  }

  return NextResponse.json({
    credentials: {
      hasAccountId,
      hasClientId,
      hasClientSecret
    },
    tokenStatus,
    liveMeetings: liveMeetingsResponse
  })
}
