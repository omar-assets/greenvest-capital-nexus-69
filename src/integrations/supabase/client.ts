
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://syopqhqxxicsihgbdtdm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5b3BxaHF4eGljc2loZ2JkdGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDg0ODQsImV4cCI6MjA2Njg4NDQ4NH0.jaIpvIiDgPoidqxMeBK8v1_yY1EfmMraz1psR5Cm2Xg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
