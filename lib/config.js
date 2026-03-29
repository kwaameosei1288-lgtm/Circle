// Configuration
window.config = {
  SUPABASE_URL: typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : 'YOUR_SUPABASE_ANON_KEY'
};