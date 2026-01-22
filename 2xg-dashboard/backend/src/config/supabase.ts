import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️ WARNING: Supabase environment variables are missing!');
  console.warn('   The server will start, but database operations will fail.');
  console.warn('   Please obtain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');

// Create Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Prefer': 'return=representation'
    },
    fetch: fetch as any
  }
});
