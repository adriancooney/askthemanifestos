import { SupabaseClient, createClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );
  }

  return _supabase;
}
