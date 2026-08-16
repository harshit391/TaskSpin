import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
