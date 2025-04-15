/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Zezwolenie na obrazy z Google (zdjęcia profilowe)
  },
  // Ustawienia dla trybu standalone - lepsze dla kontenerów
  output: "standalone",

  // Wyłącz reguły ESlint podczas budowania - budujesz na własne ryzyko!
  eslint: {
    // Ostrzegaj podczas dev, ale ignoruj podczas budowania
    ignoreDuringBuilds: true,
  },

  // Ignoruj błędy typów TypeScript podczas budowania
  typescript: {
    // Ostrzegaj podczas dev, ale ignoruj podczas budowania
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
