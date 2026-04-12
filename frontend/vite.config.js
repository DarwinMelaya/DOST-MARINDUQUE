import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Express API (see `backend/server.js`). Use 127.0.0.1 so Windows resolves the same as Node’s listen(). */
const apiTarget = "http://127.0.0.1:5000";

const apiProxy = {
  "/api": {
    target: apiTarget,
    changeOrigin: true,
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // `vite`: browser uses `/api/*` → forwarded to Express (avoids CORS in dev).
    proxy: apiProxy,
  },
  preview: {
    // `vite preview`: same proxy so `/api` works after `npm run build` without a separate reverse proxy.
    proxy: apiProxy,
  },
});
