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
  poweredByHeader: false, // Usuwanie nagłówka X-Powered-By dla bezpieczeństwa
  // Opcje konfiguracji dla eksportu
  experimental: {
    serverActions: true,
    // Dodajemy krytyczne funkcje eksperymentalne
    optimizePackageImports: ["next-auth"],
  },
  // Obsługa problemów z eksportem stron klienckich
  transpilePackages: ["next-auth"],
  // Wyłączamy eksport strony logowania, która powoduje problemy
  // (będzie renderowana po stronie serwera)
  exportPathMap: async function (defaultPathMap) {
    delete defaultPathMap["/login"];
    return defaultPathMap;
  },
};

module.exports = nextConfig;
