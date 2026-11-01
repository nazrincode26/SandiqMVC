import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Listing images are uploaded straight from the browser to Cloudinary with
  // server-signed parameters, so server actions only receive form fields and public IDs.
  serverExternalPackages: ["firebase-admin"],
  poweredByHeader: false,
};

export default nextConfig;
