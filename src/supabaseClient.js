import { createClient } from '@supabase/supabase-js';

// Load keys from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create the connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey);