const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  // Aumentar limite de tamanho para Server Actions (upload de arquivos)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Desabilitar cache durante desenvolvimento
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store, must-revalidate" },
      ],
    },
  ],
};

module.exports = nextConfig;
