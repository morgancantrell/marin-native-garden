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
            // Allow embedding from Ecwid domains and your custom domain
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.ecwid.com https://*.ecwid.net https://ecwid.com https://fairfaxplants.com https://*.fairfaxplants.com;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
