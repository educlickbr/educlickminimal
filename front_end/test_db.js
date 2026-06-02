import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJh...' // We can use the service role key from .env if available

// Better to just read the .env file
