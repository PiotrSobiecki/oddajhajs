/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Zezwolenie na obrazy z Google (zdjęcia profilowe)
  },
  // Ustawienia dla trybu standalone - lepsze dla kontenerów
  output: "standalone",
};

module.exports = nextConfig;
