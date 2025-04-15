/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Zezwolenie na obrazy z Google (zdjęcia profilowe)
  },
  // Wyłącz optymalizacje, które mogą powodować problemy podczas budowania
  output: "standalone",
};

module.exports = nextConfig;
