/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  output: "standalone",
  typescript: {
    // Ignorowanie błędów TS podczas budowania
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
