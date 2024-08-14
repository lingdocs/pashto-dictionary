import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      workbox: {
        // globPatterns: ["**/*.(mp4|m4a)"],
        globPatterns: ["*/*.*", "*.*"],
        maximumFileSizeToCacheInBytes: 5242880,
      },
      includeAssets: ["**/*.(js|html|svg|png|jpg|jpeg|eot|woff|woff2|ttf)"],
      filename: "service-worker.js",
      manifest: {
        short_name: "Pashto Dictionary",
        name: "LingDocs Pashto Dictionary",
        id: "/",
        icons: [
          {
            src: "/icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/maskable_icon_x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/maskable_icon_x1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        display: "standalone",
        theme_color: "#596267",
        background_color: "#f9f9f9",
        start_url: ".",
        description:
          "An offline Pashto Dictionary app with audio, approximate search-as-you-type, alphabetical browsing, verb conjugation, inflections, and a phrase generation engine.",
        launch_handler: {
          client_mode: "auto",
        },
        categories: [
          "education",
          "language",
          "productivity",
          "language learning",
          "Pashto",
          "dictionaries",
        ],
        lang: "en",
        prefer_related_applications: false,
        share_target: {
          action: "/share-target",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
      },
    }),
  ],
});
