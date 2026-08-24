import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthUserId(): Promise<string | null> {
  const bypass = process.env.NEXT_PUBLIC_AUTH_BYPASS_USER_ID;
  if (bypass) return bypass;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
