import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
	serverExternalPackages: ["@takumi-rs/core"],
}

export default nextConfig
