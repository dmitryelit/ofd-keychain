import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ofd-keychain/editor-ui",
    "@ofd-keychain/export-core",
    "@ofd-keychain/render-engine",
    "@ofd-keychain/scene-core"
  ]
};

export default nextConfig;
