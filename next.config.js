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
            // Allow embedding from Ecwid and same origin
            // Using CSP frame-ancestors instead of X-Frame-Options for better control
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.ecwid.com https://*.ecwid.net https://ecwid.com;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
