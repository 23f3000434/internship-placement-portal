import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etnmaluhlgwvwjpxvnof.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bm1hbHVobGd3dndqcHh2bm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTcxNDEsImV4cCI6MjEwMjc5MzE0MX0.i6MDgMc7vg7dtpmKQpvceNVnfF4DT9-glCMvjxTMNz8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
