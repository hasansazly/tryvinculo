import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublishableKey, getSupabaseUrl } from './env'

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabasePublishableKey()

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
