import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    mode === "development" ? dyadComponentTagger() : null,
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false, // Désactiver en production pour réduire la taille
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les gros vendors pour optimiser le cache
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-tooltip"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "chatkit-vendor": ["@openai/chatkit-react"],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Augmenter la limite si nécessaire
  },
  base: "/", // Important pour OVH
}));