import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { paperContentPlugin, quizContentPlugin } from "@quiz/core/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    quizContentPlugin({ contentDir: "./content/questions" }),
    paperContentPlugin({ contentDir: "./content/paper" }),
  ],
});
