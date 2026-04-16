import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: "frontend",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "frontend/index.html"),
        login: resolve(__dirname, "frontend/login.html"),
        signup: resolve(__dirname, "frontend/signup.html"),
        dashboard: resolve(__dirname, "frontend/dashboard.html")
      }
    }
  }
});
