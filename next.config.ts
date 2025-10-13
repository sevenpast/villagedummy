import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Exclude Supabase Edge Functions from webpack compilation
    config.externals = config.externals || [];
    config.externals.push({
      'https://deno.land/std@0.168.0/http/server.ts': 'commonjs https://deno.land/std@0.168.0/http/server.ts',
      'https://esm.sh/@supabase/supabase-js@2': 'commonjs https://esm.sh/@supabase/supabase-js@2'
    });
    return config;
  },
  // Exclude supabase functions directory from build
  experimental: {
    outputFileTracingExcludes: {
      '*': ['./supabase/functions/**/*']
    }
  }
};

export default nextConfig;
