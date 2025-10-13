import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude supabase functions directory from build
  outputFileTracingExcludes: {
    '*': ['./supabase/functions/**/*']
  }
};

export default nextConfig;
