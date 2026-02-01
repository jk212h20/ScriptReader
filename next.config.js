/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway.app deployment settings
  output: 'standalone',
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
}

module.exports = nextConfig
