import { createClient } from '@supabase/supabase-js';
import { createSessionPasswordUpdater } from './authPassword';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || '';

export const supabase = (supabaseUrl && supabasePublishableKey)
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true
      }
    })
  : null;

export const updatePasswordForSession = supabase
  ? createSessionPasswordUpdater({ url: supabaseUrl, publishableKey: supabasePublishableKey })
  : null;
