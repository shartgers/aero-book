import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack resolveAlias does not fix CSS @import resolution (tailwind still resolves in D:\GitHub). Use `npm run dev` which runs with --webpack so the webpack resolve below applies.
  turbopack: {
    resolveAlias: {
      tailwindcss: path.join(__dirname, "node_modules", "tailwindcss"),
      "tw-animate-css": path.join(__dirname, "node_modules", "tw-animate-css"),
    },
  },
  // Force module resolution from project directory so 'tailwindcss' and other
  // packages resolve in aero-book/node_modules instead of parent D:\GitHub (Windows path bug).
  webpack: (config, { dir }) => {
    const projectDir = path.resolve(dir ?? __dirname);
    config.resolve = config.resolve ?? {};
    config.resolve.modules = [
      path.join(projectDir, "node_modules"),
      "node_modules",
    ];
    return config;
  },
};

export default nextConfig;
