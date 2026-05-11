import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Masked logging for security but enough to see if it exists
console.log("Supabase Client Init - URL:", supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : "MISSING");
console.log("Supabase Client Init - Key:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 8)}...` : "MISSING");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("CRITICAL: Missing Supabase environment variables! Check your frontend/.env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)