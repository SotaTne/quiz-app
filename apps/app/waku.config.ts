import { cloudflare } from "@cloudflare/vite-plugin";
import { quizContentPlugin } from "@quiz/core";
import { defineConfig } from "waku/config";

// このアプリはCloudflare Workers専用(他プラットフォームは想定しない。SPEC.md参照)。
// @cloudflare/vite-plugin(cloudflare()プラグイン)が開発時・ビルド時ともに実際のworkerdランタイム上で
// コードを動かすため、D1などのバインディングが`cloudflare:workers`経由で追加シムなしに使える。
// 構成は公式ガイド(https://waku.gg/guides/cloudflare)に準拠。
export default defineConfig({
  vite: {
    environments: {
      rsc: {
        optimizeDeps: {
          include: ["hono/tiny"],
          // devの依存事前バンドルスキャンは`cloudflare:workers`を解決できず警告を出すだけ
          // (実行時はcloudflare()プラグインがworkerd経由で解決するので実害はない)。除外して静める。
          exclude: ["cloudflare:workers"],
        },
        build: {
          rolldownOptions: {
            platform: "neutral",
            // workerdランタイムが解決するモジュールなのでバンドルしない(cloudflare()プラグインが
            // dev/build実行時に実体を提供する。src/waku.server.tsx参照)。
            external: ["cloudflare:workers"],
          },
        },
      },
      ssr: {
        optimizeDeps: { include: ["waku > rsc-html-stream/server"] },
        build: { rolldownOptions: { platform: "neutral" } },
      },
    },
    plugins: [
      quizContentPlugin({ contentDir: "./content/questions" }),
      cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }, inspectorPort: false }),
    ],
  },
});
