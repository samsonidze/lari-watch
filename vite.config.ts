import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nbgDevApi } from "./server/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), nbgDevApi()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { recharts: ["recharts"] },
      },
    },
  },
});
