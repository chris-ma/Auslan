import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required so webpack transpiles the @auslan/vocab TypeScript workspace package
  transpilePackages: ["@auslan/vocab"],
  async headers() {
    return [
      {
        // Required for SharedArrayBuffer (MediaPipe WASM multi-threading)
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  webpack(config) {
    // Allow WASM imports
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
