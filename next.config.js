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
  eslint: {
    // Ignorowanie błędów ESLint podczas budowania
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Pomijanie sprawdzania typów podczas budowania
    skipTypeChecking: true,
    // Optymalizacje dla kontenerów
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
