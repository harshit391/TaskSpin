// Fails fast with a clear message when required configuration is missing, instead of
// surfacing later as a confusing Supabase/Prisma error on the first request.

const REQUIRED = ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

export interface EnvReport {
  /** The app cannot work without these. */
  errors: string[];
  /** Something specific is disabled or degraded. */
  warnings: string[];
}

export function validateEnv(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED) {
    if (!env[key]) errors.push(`${key} is not set`);
  }

  if (env.NEXT_PUBLIC_SUPABASE_URL && !/^https?:\/\//.test(env.NEXT_PUBLIC_SUPABASE_URL)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://");
  }

  if (env.NODE_ENV === "production" && !env.CRON_SECRET) {
    // Only the nightly jobs depend on it, so don't take the whole app down
    warnings.push("CRON_SECRET is not set: cron endpoints will reject every request");
  }

  if (env.APP_TIMEZONE) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: env.APP_TIMEZONE });
    } catch {
      errors.push(`APP_TIMEZONE "${env.APP_TIMEZONE}" is not a valid IANA timezone (e.g. Asia/Kolkata)`);
    }
  }

  return { errors, warnings };
}
