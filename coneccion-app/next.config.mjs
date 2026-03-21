/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'static.arasaac.org',
      },
      {
        protocol: 'https',
        hostname: 'api.arasaac.org',
      },
    ],
  },
}

export default nextConfig
