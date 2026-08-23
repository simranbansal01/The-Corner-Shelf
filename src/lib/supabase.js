import { createClient } from '@supabase/supabase-js'

// These come from your .env file, see .env.example.
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are from your Supabase project settings (API section).
// The anon key is safe to expose in frontend code: Row Level Security (RLS) is what actually protects data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project URL + anon key.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
