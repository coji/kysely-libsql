import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: "index",
    },
  },
  plugins: [
    dts({ exclude: ["vite.config.ts", "node_modules/**"], rollupTypes: true }),
  ],
});
