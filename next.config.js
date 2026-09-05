// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: ["img.clerk.com"], // ✅ allow Clerk images
//   },
// }

// const pwaConfig = {
//   dest: "public",
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development", // disable in dev
// }

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});
