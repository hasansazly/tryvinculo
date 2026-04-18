import { createClient } from '@supabase/supabase-js';
import { getSupabasePublishableKey, getSupabaseUrl } from '../../utils/supabase/env';

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabasePublishableKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
