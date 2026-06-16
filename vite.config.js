import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", injectRegister: "auto",
      includeAssets: ["favicon.png","apple-touch-icon.png","hero.jpg","logo.jpg","zone-strength.jpg","zone-functional.jpg","zone-fuelbar.jpg","zone-retail.jpg","zone-reception.jpg","zone-studio.jpg","zone-recovery.jpg","zone-lounge.jpg","zone-courtyard.jpg","plan-site.jpg","plan-ground.jpg","plan-second.jpg"],
      manifest: {
        name: "SIRA Muscle Studios — Investor Pitch", short_name: "SIRA Pitch",
        description: "Jakarta's first capital-efficient Muscle Studios compound. Investor pitch. Works offline.",
        theme_color: "#ECE8DF", background_color: "#ECE8DF",
        display: "standalone", orientation: "portrait", start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,ico}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: "StaleWhileRevalidate", options: { cacheName: "g-fonts-css", expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } } },
          { urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i, handler: "CacheFirst", options: { cacheName: "g-fonts-files", cacheableResponse: { statuses: [0,200] }, expiration: { maxEntries: 30, maxAgeSeconds: 31536000 } } }
        ]
      }
    })
  ]
});
