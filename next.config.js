/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Zezwolenie na obrazy z Google (zdjęcia profilowe)
  },
  // Wyłączamy tryb standalone, który powoduje problemy
  // output: "standalone",
  typescript: {
    // Ignorowanie błędów TS podczas budowania
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorowanie błędów ESLint podczas budowania
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false, // Usuwanie nagłówka X-Powered-By dla bezpieczeństwa

  // Wyłączenie prerenderowania, które powoduje problemy
  experimental: {
    disableOptimizedLoading: true,
    optimizeCss: false,
  },
};

module.exports = nextConfig;
