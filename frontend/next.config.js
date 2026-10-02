/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/apply',
        permanent: false,
      },
      {
        source: '/create',
        destination: '/apply',
        permanent: false,
      },
      {
        source: '/auth/register/student',
        destination: '/apply',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
