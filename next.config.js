/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Zezwolenie na obrazy z Google (zdjęcia profilowe)
  },
  output: "standalone",
  typescript: {
    // Ignorowanie błędów TS podczas budowania
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorowanie błędów ESLint podczas budowania
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
