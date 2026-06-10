import { createClient } from "@supabase/supabase-js";

const isProd = import.meta.env.PROD;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (isProd && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error("❌ Critical Configuration Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in production mode.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
