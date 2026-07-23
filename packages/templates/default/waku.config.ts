import { quizContentPlugin } from "@quiz/core";
import { defineConfig } from "waku/config";

export default defineConfig({
  unstable_viteConfigs: {
    common: () => ({
      plugins: [quizContentPlugin({ contentDir: "./content/questions" })],
    }),
  },
});
