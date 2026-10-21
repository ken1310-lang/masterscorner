import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // The prototype forbids base64 fonts (deviation D8); Vite would otherwise
    // inline any asset under 4 kB, which a subset woff2 can be.
    assetsInlineLimit: (filePath) =>
      filePath.endsWith(".woff2") ? false : undefined,
  },
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
});
