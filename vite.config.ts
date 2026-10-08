import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ["src/**/*.test.ts"],
    // Sin esto Vitest entrega los .css vacíos, y la prueba de contraste lee los tokens de ahí.
    css: { include: [/styles\/index\.css/] },
  },
});
