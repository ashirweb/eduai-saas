import { createClient } from '@supabase/supabase-js';

// Environment variables se URL aur Key nikaal rahe hain
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Supabase client bana rahe hain jo poori app mein use hoga
export const supabase = createClient(supabaseUrl, supabaseAnonKey);