/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Zezwolenie na obrazy z Google (zdjęcia profilowe)
  },
};

module.exports = nextConfig;
