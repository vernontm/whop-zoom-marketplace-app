import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using fallback storage.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface CompanyZoomSettings {
  id?: string
  company_id: string
  account_id: string
  client_id: string
  client_secret: string
  sdk_key: string
  sdk_secret: string
  permanent_meeting_id?: string
  default_meeting_title?: string
  admin_usernames?: string[]
  created_at?: string
  updated_at?: string
}
