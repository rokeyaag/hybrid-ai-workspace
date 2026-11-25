import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          firebase: [
            "firebase/app",
            "firebase/app-check",
            "firebase/auth",
            "firebase/firestore",
            "firebase/remote-config",
            "firebase/ai",
          ],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
