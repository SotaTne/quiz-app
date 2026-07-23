import { loadQuestionSets } from "../content/load-question-sets";

const VIRTUAL_MODULE_ID = "virtual:quiz-content";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export type QuizContentPluginOptions = {
  /** `content/questions`のような、問題MDファイルが置かれたディレクトリ */
  contentDir: string;
};

// vite自体の型を持ち込まない(hand-rolledの構造的な型に留める)。
// vitestとwakuが要求するviteのバージョンが食い違うため、vite本体の型を
// importするとPluginの構造比較で衝突する。実行時はダックタイピングで問題ない。
type DevServer = {
  watcher: {
    add(path: string): void;
    on(event: "all", listener: (event: string, filePath: string) => void): void;
  };
  moduleGraph: {
    getModuleById(id: string): unknown;
    invalidateModule(mod: NonNullable<unknown>): void;
  };
  ws: { send(payload: { type: "full-reload" }): void };
};

export type QuizContentVitePlugin = {
  name: string;
  resolveId(id: string): string | undefined;
  load(id: string): string | undefined;
  configureServer(server: DevServer): void;
};

function generateModuleCode(contentDir: string): string {
  const result = loadQuestionSets(contentDir);
  if (!result.ok) {
    throw new Error(`問題データの検証に失敗しました:\n${result.errors.join("\n")}`);
  }
  return `export default ${JSON.stringify(result.data)};`;
}

/**
 * `content/questions/**​/*.md`を`virtual:quiz-content`という仮想モジュールにする。
 * `import questionSets from "virtual:quiz-content"`でwaku側から`QuestionSet[]`を取得できる。
 */
export function quizContentPlugin(options: QuizContentPluginOptions): QuizContentVitePlugin {
  const { contentDir } = options;

  return {
    name: "quiz-content",

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) return generateModuleCode(contentDir);
    },

    configureServer(server) {
      server.watcher.add(contentDir);
      server.watcher.on("all", (_event, filePath) => {
        if (!filePath.endsWith(".md")) return;
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
        if (!module) return;
        server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
