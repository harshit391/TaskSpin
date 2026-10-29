import { createServerSupabaseClient } from "@/lib/supabase/server";

// Dev-only: skip Supabase auth and act as a fixed user. Never honored in production.
export function getAuthBypassUserId(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return process.env.NEXT_PUBLIC_AUTH_BYPASS_USER_ID || null;
}

export async function getAuthUserId(): Promise<string | null> {
  const bypass = getAuthBypassUserId();
  if (bypass) return bypass;

  // getClaims verifies the JWT locally (no Auth server round-trip when the
  // project uses asymmetric signing keys), unlike getUser which always hits the network.
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}
