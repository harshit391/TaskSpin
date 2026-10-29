import type { NextConfig } from "next";

const isProductionBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    // Dev-only auth bypass. Blanked in production builds so the user ID is never
    // inlined into the public JS bundle, even if the variable is set on the host.
    NEXT_PUBLIC_AUTH_BYPASS_USER_ID: isProductionBuild ? "" : process.env.NEXT_PUBLIC_AUTH_BYPASS_USER_ID ?? "",
  },
};

export default nextConfig;
