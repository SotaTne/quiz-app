import { quizContentPlugin } from "@quiz/core";
import { defineConfig } from "waku/config";

export default defineConfig({
  vite: {
    plugins: [quizContentPlugin({ contentDir: "./content/questions" })],
  },
});
