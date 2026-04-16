const clean = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const pick = (names: string[]) => {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) {
      return clean(value);
    }
  }
  return null;
};

export const getSupabaseUrl = () => {
  const value = pick(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
  if (!value) {
    throw new Error('Missing Supabase URL env var. Expected NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.');
  }
  return value;
};

export const getSupabasePublishableKey = () => {
  const value = pick([
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
  ]);
  if (!value) {
    throw new Error(
      'Missing Supabase key env var. Expected NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return value;
};
