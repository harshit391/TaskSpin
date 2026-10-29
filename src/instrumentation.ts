// Runs once when the Node.js server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv } = await import("@/lib/env");
  const { errors, warnings } = validateEnv();

  for (const warning of warnings) console.warn(`⚠ ${warning}`);
  if (errors.length === 0) return;

  const message = `Invalid environment configuration:\n  - ${errors.join("\n  - ")}`;
  if (process.env.NODE_ENV === "production") throw new Error(message);
  console.warn(`\n⚠ ${message}\n`);
}
