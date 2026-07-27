import { loadQuestionSets } from "../content/load-question-sets.ts";
import { loadPapers } from "../content/load-papers.ts";

const VIRTUAL_MODULE_ID = "virtual:quiz-content";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const PAPER_VIRTUAL_MODULE_ID = "virtual:paper-content";
const RESOLVED_PAPER_VIRTUAL_MODULE_ID = `\0${PAPER_VIRTUAL_MODULE_ID}`;

export type QuizContentPluginOptions = {
  /** `content/questions`のような、問題MDファイルが置かれたディレクトリ */
  contentDir: string;
};

export type PaperContentPluginOptions = {
  /** `content/paper`のような、カンペのMarkdown/mmdファイルが置かれたディレクトリ */
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

function generateQuizModuleCode(contentDir: string): string {
  const result = loadQuestionSets(contentDir);
  if (!result.ok) {
    throw new Error(`問題データの検証に失敗しました:\n${result.errors.join("\n")}`);
  }
  return `export default ${JSON.stringify(result.data)};`;
}

function generatePaperModuleCode(contentDir: string): string {
  const result = loadPapers(contentDir);
  if (!result.ok) {
    throw new Error(`カンペデータの検証に失敗しました:\n${result.errors.join("\n")}`);
  }
  return `export default ${JSON.stringify(result.data)};`;
}

function contentPlugin(input: {
  name: string;
  contentDir: string;
  virtualModuleId: string;
  resolvedVirtualModuleId: string;
  generateModuleCode: (contentDir: string) => string;
}): QuizContentVitePlugin {
  return {
    name: input.name,
    resolveId(id) {
      if (id === input.virtualModuleId) return input.resolvedVirtualModuleId;
    },
    load(id) {
      if (id === input.resolvedVirtualModuleId) return input.generateModuleCode(input.contentDir);
    },
    configureServer(server) {
      server.watcher.add(input.contentDir);
      server.watcher.on("all", (_event, filePath) => {
        if (!filePath.endsWith(".md") && !filePath.endsWith(".mmd")) return;
        const module = server.moduleGraph.getModuleById(input.resolvedVirtualModuleId);
        if (!module) return;
        server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}

/**
 * `content/questions/**​/*.md`を`virtual:quiz-content`という仮想モジュールにする。
 * `import questionSets from "virtual:quiz-content"`でwaku側から`QuestionSet[]`を取得できる。
 */
export function quizContentPlugin(options: QuizContentPluginOptions): QuizContentVitePlugin {
  return contentPlugin({
    name: "quiz-content",
    contentDir: options.contentDir,
    virtualModuleId: VIRTUAL_MODULE_ID,
    resolvedVirtualModuleId: RESOLVED_VIRTUAL_MODULE_ID,
    generateModuleCode: generateQuizModuleCode,
  });
}

/** `content/paper/**​/*.{md,mmd}`を`virtual:paper-content`として公開する。 */
export function paperContentPlugin(options: PaperContentPluginOptions): QuizContentVitePlugin {
  return contentPlugin({
    name: "paper-content",
    contentDir: options.contentDir,
    virtualModuleId: PAPER_VIRTUAL_MODULE_ID,
    resolvedVirtualModuleId: RESOLVED_PAPER_VIRTUAL_MODULE_ID,
    generateModuleCode: generatePaperModuleCode,
  });
}
