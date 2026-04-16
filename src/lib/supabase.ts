import { createClient } from '@supabase/supabase-js';

const stripEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value.trim().replace(/^['"]|['"]$/g, '');
};

const supabaseUrl = stripEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = stripEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
