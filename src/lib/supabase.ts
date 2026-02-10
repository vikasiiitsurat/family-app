import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Member {
  id: string;
  name: string;
  email: string;
  dob: string;
  anniversary?: string | null;
  message?: string | null;
  created_at: string;
}
