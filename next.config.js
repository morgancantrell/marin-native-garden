/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            // Allow embedding in iframes (required for Ecwid)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Change to 'ALLOWALL' if you want to allow any origin
          },
          {
            // Optional: Allow specific Ecwid domains
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.ecwid.com https://*.ecwid.net;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
