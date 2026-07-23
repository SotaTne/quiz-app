# クイズアプリ 仕様書 (v0.4 ドラフト)

想定用途: テスト前の一夜漬け・詰め込み学習。間隔反復(長期記憶定着)ではなく、直近で「間違えた問題を優先的に出す」ことが目的。

使用バージョン: `waku@1.0.0-beta.7`(vite 8, react/react-dom/react-server-dom-webpack ~19.2.4)。Cloudflareへのデプロイには`@cloudflare/vite-plugin`(dev/buildの実行をworkerdランタイム上で行う)と`wrangler@4`系が必要(公式ガイド: https://waku.gg/guides/cloudflare)。

## 1. コンセプト

**「設定ファイル + Markdownを置くだけでクイズアプリになるフレームワーク」を作る。**

パッケージの分け方は**better-authの設計を参考**にする。better-authは本体がスキーマを定義し、利用側が任意のDB/ORMに接続する。これに倣い:

- `core`: フレームワーク本体。VitePress/Astro Content Collectionsのように「設定 + コンテンツ → アプリ」を実現する。**`attempts`のDrizzleスキーマを公開エクスポート**し、そのスキーマに対して動く`Store`実装も同梱する（DBの抽象化はしない。Drizzle前提で割り切る）。**`auth`パッケージにも直接依存してよい**（抽象化のためのインターフェースを挟まず、`auth`をそのままimportしてセッション取得・回答判定・記録までを一気通貫でこなす「authも含めたフレームワーク」として設計する）。waku RSCページはブログフレームワークのテーマのように、デフォルト一式を提供しつつ差し替え・カスタマイズができるようにする。
- `db`: `core`が公開するスキーマを使って、実際のD1インスタンスに対するマイグレーション管理・接続の組み立てを行うパッケージ。**汎用性より「自分が使いやすいこと」を優先**して作る。
- `auth`: better-auth + Google OAuth + allowlistの設定をまとめるパッケージ。こちらも汎用性より使いやすさ優先。secret/baseURL/allowedEmailsなどの実際の値は持たない。
- `app`: `core`・`db`・`auth`を組み立てる利用者側。実際の値(D1インスタンス、secret、allowedEmails)を渡し、マイグレーション適用の実行を担う。`waku.config.ts`(Vite pluginの登録)と`content/questions/**.md`を置くだけの薄い実装。**`defineQuizConfig()`のような単一の設定オブジェクトは作らない** — `contentDir`はビルド時(Vite plugin)だけの関心事、`store`/`auth`は実行時(リクエストごとの`env`)の関心事で、性質が違うものを1つにまとめる意味がなかったため撤回した(Cloudflare Workersはモジュールトップレベルで`env`に触れないため、`store`/`auth`はどのみちリクエスト処理の中で組み立てる必要がある)。
- 機能は最小限に絞る。凝った機能が欲しくなったら別アプリを使う、を原則にする（過剰な抽象化・設定項目を増やさない）。
- 将来、自分以外の人も`core`を使えるようにする（`core`が公開するスキーマ・`Store`実装・デフォルトページをベースに、`db`/`auth`だけ自分用に差し替えれば良い。`core→auth`の依存自体は固定でよい）。
- **問題データ(正解を含む)がクライアントにそのまま渡ることは許容する。** 不正解防止のための秘匿は行わない（テスト前学習用の個人アプリであり、不正対策が必要な試験ではないため）。フラッシュカードはむしろ全カードの表裏データを事前にまとめてクライアントに渡し、カードをめくるたびの通信待ちをなくす。

## 2. モノレポ構成

```
quiz-app/
  packages/
    core/                     # フレームワーク本体
      src/
        content/              # MDパーサー・スキーマ検証・deriveSetId()・loadQuestionSets()
        vite-plugin/           # quizContentPlugin(): content -> virtual:quiz-content
        distractors/           # 4択の誤答生成ロジック
        filters/                # 出題フィルタ (全問 / 苦手問題のみ)
        pages/                 # プレゼンテーション用コンポーネント: SetListView(Server)/FlashcardView・FourChoiceView(Client)
                                 # データ取得(virtual:quiz-content読み込み・習熟度集計)やwaku createPagesでの実際のルート登録はまだ
        actions/                # submitAnswer(request, { store, auth }): Response。waku createApi等から呼び出す想定
                                 # authはcreateAuth()の戻り値をそのまま渡せる(AuthLikeという最小構造型で受ける)
        schema.ts               # 公開Drizzleスキーマ (attempts)
        store.ts                 # スキーマに対応するStore実装 (createStore)
    db/                       # core.attempts + better-authスキーマを束ねた、D1向けのマイグレーション/接続管理（自分用）
      src/
        schema.ts                # core.attempts + better-auth生成スキーマをまとめてre-export
        migrations/              # drizzle-kitが生成するマイグレーションファイル（唯一の適用先）
        client.ts                 # D1接続の組み立て
    auth/                     # better-auth + Google OAuth + allowlistの設定（自分用）
      src/
        auth.ts                  # better-auth設定(secret/baseURL/allowedEmailsはappから注入)
    cli/                      # アプリ雛形・セット雛形を生成するCLI
      src/
        create-app.ts             # `quiz create <name>` : templates/defaultをコピーしてアプリを生成
        new-set.ts                 # `quiz new <name>` : content/questions/配下にテーブル雛形のMDを生成(階層可)
    templates/
      default/                  # `quiz create`がコピーする、実在するワークスペースパッケージ
        waku.config.ts             # quizContentPluginをここで直接登録する
        wrangler.toml
        content/questions/example.md
  apps/                       # デプロイ対象(packages/はライブラリ・ツール)
    app/                      # 利用者側(自分の本番アプリ)。`quiz create`で生成し、core/db/authを組み立てるだけ
      content/questions/**/*.md   # サブディレクトリでセットを分類可能(例: english/part1.md)
      waku.config.ts
      wrangler.toml
    docs/                     # ドキュメントサイト(Astro Starlight)
      src/content/docs/
        spec.md                # 本仕様書
        design.md               # 基本設計書(UML)
  .github/workflows/
    validate-content.yml       # MDバリデーションCI
```

- `core`は`auth`パッケージに直接依存する（`db`には依存せず、Storeを通してDrizzleインスタンスを受け取るだけ）。スキーマとStore実装を公開エクスポートすることで、`db`はマイグレーション管理に専念できる。
- `db`・`auth`は汎用アダプタではなく、「自分が使いやすいように」作る前提のパッケージ。将来他人が使う場合はこの2つを参考に自分用に書き換えることを想定する。
- `app`にはロジックを書かない。実際の値(D1インスタンス・secret・allowedEmails)を用意し、`core`/`db`/`auth`を組み立てるのみ。

## 3. `core`の設計（参考にしたプロダクトとその要素）

| 参考 | 取り入れる要素 |
|---|---|
| **VitePress** | 設定ファイル(`.vitepress/config.ts`)一つでサイト全体が組み上がる体験。`waku.config.ts`でのVite plugin登録として同様の体験を実現 |
| **Astro Content Collections** | `Sources → Loaders → 型付きデータ → 出力`というパイプライン。MDテーブルをスキーマ(Zod等)でバリデーションしつつ型付きの`Question[]`に変換する設計を踏襲 |
| **Quizlet** | フラッシュカードの操作感、複数の学習モード（フラッシュカード/4択/Learn）、セット単位の進捗表示 |

SRS(間隔反復・Ankiのようなease factor/due date管理)は今回の用途（テスト前の詰め込み）には不要と判断し、不採用。連続スコアのような優先度計算もせず、「全問」「苦手問題のみ」という**モード選択(フィルタ)**に置き換える（3.2参照）。

### 3.1 Content Layer（Astro参考）

1. `content/questions/**/*.md` を読み込む（1ファイル=1セット）。サブディレクトリでセットを分類できる(例: `content/questions/english/part1.md`)。setIdは`contentDir`からの相対パス(拡張子を除く)で、階層をそのまま持つ(`english/part1`)。`deriveSetId(contentDir, filePath)`がこの変換を担う純粋関数(`core`が提供)。
2. テーブルをパースし、スキーマ検証（必須列: id/question/answer）
3. 検証済みデータを型付きJSONとしてビルド時に生成
4. Vite plugin（標準搭載）でこれを仮想モジュール化し、wakuの開発サーバー/ビルドからimportできるようにする（HMR対応）。waku自体もRSC(React Server Components)構成で組む。

階層はセットの置き場所(ファイルパス)だけの話であり、個々の`Question`自体はフラットなまま(サブ問題や入れ子構造は持たない)。4択の誤答生成・出題フィルタ・Storeはどれも`questionId`の文字列内容に依存しないため、この階層化によるロジック変更は不要。

### 3.2 出題フィルタ（全問 / 苦手問題のみ）

継続的な優先度スコア(SRS的なもの)は採用しない。代わりに、出題開始時にユーザーが選ぶ**2つのフィルタモード**だけを用意する。

- **全問**: セット内の全問題を出題（順序はシャッフル）。
- **苦手問題のみ**: そのセットの各問題について「同じ`mode`(quizならquiz、flashcardならflashcard)での直近1件の`attempts`」を見て、`isCorrect = false`、または一度もそのmodeで解いていない問題だけを抽出する。

集計は「`questionId`+`mode`ごとの最新1件」を見るだけのシンプルなクエリで済み、期間指定・減衰といった曖昧さを持たない。フラッシュカードと4択は別`mode`として記録するため、フィルタも互いに影響しない。「最新1件」の同順位は`answeredAt DESC, id DESC`で決定する（`answeredAt`が同一時刻になっても`id`で一意に順序が決まる）。

### 3.3 4択の誤答生成

1. 候補プール = 同じセット（同一MDファイル）内の他問題の`answer`。
2. 対象問題自身の`answer`と一致するものは候補から除外する。
3. 前後の空白除去・大文字小文字を無視して正規化した上で、重複する`answer`は1つにまとめる。
4. 候補が3つ未満の場合、全セット横断で同様のルールで候補を補う。
5. それでも3つ未満の場合はエラーにせず、その問題は4択を提供せず**フラッシュカードのみ**で出題する（呼び出し側にその旨を返す）。

### 3.4 学習モード（Quizlet参考、最小限）

| モード | 正誤の決め方 |
|---|---|
| フラッシュカード | 自己申告（知ってる/知らない）をそのまま`isCorrect`として記録 |
| 4択 | 選んだ選択肢と正解を**クライアント側で**比較して`isCorrect`を決める（正解データは3.1の通りクライアントに露出済みなので、サーバー側で再判定する必要はない） |

正誤はどちらも`mode`ごとに独立して`attempts`に記録する。両モードとも開始時に「全問 / 苦手問題のみ」(3.2)を選択できる。セット一覧画面ではモードごとの正答率を別々に表示する（フラッシュカードの自己申告「知ってる」と4択の客観的な正誤を混ぜない）。

問題データ(`answer`含む)は事前にクライアントへ全てバルクで渡す。特にフラッシュカードはこれにより、カードをめくるたびの通信待ちがゼロになる。

### 3.5 回答記録の方式（両モード共通・即時送信 + 失敗時のみローカル退避）

やりたいことは「サーバー側での厳密な正誤判定」ではなく、**(a)正誤の永続化**と**(b)途中離脱からの再開**の2つ。したがって4択もフラッシュカードも同じ経路に統一する。バッチ化(一定間隔でまとめて送信)は行わず、シンプルに**1問ごとの即時送信**にする。

1. 回答するたびに、クライアント側で`isCorrect`を計算し、`id`(`crypto.randomUUID()`などクライアント生成)・`questionId`・`mode`・`isCorrect`を`fetch(url, { keepalive: true })`で即座に送信する。`keepalive: true`により、画面遷移・タブを閉じる際でもリクエストの送信が継続される。
2. サーバー側(`core`が提供する`submitAnswer(request, { store, auth })`)は`auth.api.getSession({ headers })`で`userId`をセッションから取得し(coreが直接依存する`auth`経由)、リクエストボディを`parseSubmitAnswerInput()`で検証したうえで`Store.recordAttempt`を呼ぶ。未ログインは401、ボディのJSON不正は400、必須フィールド不正は422を返す。
3. `Store.recordAttempt`は`id`を主キーとして`INSERT OR IGNORE`する（同じ`id`のリクエストが2回届いても2重に記録されない、冪等な書き込み）。
4. 送信失敗時の扱いはHTTPステータスで分類する。**ネットワーク到達不可・5xx**は一時的な失敗とみなし`localStorage`に退避して再送対象にする。**401/403(未認証・allowlist対象外)・400/422(不正な入力)**は再送しても解決しないため、そのエントリは**破棄**する(ログアウト後もキューが残り続けることを防ぐ)。
5. `localStorage`退避時のキーは**ログイン中のセッションの`userId`で名前空間化**する(例: `retryQueue:${userId}`)。次回アプリ起動時、現在のセッションに対応するキーの`localStorage`に退避済みのエントリがあれば同じ`id`のまま再送を試み、成功したら削除する。これにより、同じブラウザで別ユーザーがログインしても別の名前空間を見るだけなので、他人の未送信回答が混ざることはない。

`attempts`は1問答えるごとに継続的に永続化されるため、セッションの状態を別途持たなくても「苦手問題のみ」フィルタ(3.2)がそのまま再開機能を兼ねる（すでに正解した問題は次に開いたときに自動的に除外される）。ただし「全問」モードでの厳密な出題位置の復元(何問目まで進めたか)はサポートしない（次回開いたときは最初から出題し直す）。`Store.recordAttempt`はこのServer Action内部からのみ呼ばれる想定とし、クライアントから直接叩けるAPIとしては公開しない。`userId`はサーバー側セッションから取得するため、`isCorrect`の計算はクライアント任せでも記録者(誰の記録か)は偽装できない。

### 3.6 `core`が公開するスキーマとStore（better-auth方式）

問題データそのものはD1に保存しない（MDが正、ビルド時に静的データ化）。D1はユーザーの学習記録のみを持つ。テーブルは`attempts`のみ（SRS用の状態テーブルは持たない）。

```ts
// core/src/schema.ts — 公開エクスポート。db側はこれをimportしてマイグレーションを生成する
export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull(),
  mode: text("mode").notNull(), // "quiz" | "flashcard"
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp" }).notNull(),
});

// core/src/store.ts — 上記スキーマに対して動くStore実装。db側が用意したdrizzleインスタンスを渡すだけで使える
// recordAttemptは3.5のServer Action(submitAnswer)内部からのみ呼び出す想定（クライアント直呼び出し禁止、idはINSERT OR IGNOREで冪等）
export function createStore(db: DrizzleD1Database<typeof schema>): Store { /* ... */ }
```

- `userId`ベースの設計のため、将来複数ユーザーに対応する場合もスキーマ変更は不要。
- 認証は抽象インターフェースを挟まず、`core`が`auth`パッケージを直接importして`getSession`を呼ぶ。DBだけ`Store`という薄い型で外から差し込める形にし、認証はcoreに直接組み込む非対称な設計にする。

## 4. `db`パッケージ（自分用のD1接続・マイグレーション管理）

- `db/src/schema.ts`で、`core`が公開する`attempts`スキーマと、better-auth CLIが生成する`user`/`session`/`account`/`verification`スキーマを1つにまとめてre-exportする。**同じD1に対するマイグレーション履歴・適用先は1つに統一する**（`attempts`用とbetter-auth用でマイグレーション管理を分けない）。
- 上記のまとめたスキーマに対して`drizzle-kit`でマイグレーションファイルを生成・管理する。
- D1インスタンスから`drizzle(d1, { schema })`を組み立てるヘルパー(`createDb`)を提供する。
- マイグレーションの適用は**手動コマンド**(`pnpm db:migrate` → 内部で`wrangler d1 migrations apply`)のみ。CI/CDでの自動適用は行わない（8章のCI/CD方針と一致させる）。
- 汎用アダプタは目指さず、このアプリで使いやすい形に閉じてよい。

## 5. `auth`パッケージ（自分用のbetter-auth設定）

- better-authの標準テーブル(`user`/`session`/`account`/`verification`)を利用。ログイン方式はGoogle OAuthのみ。
- `allowedEmails`にないメールアドレスは`databaseHooks.user.create.before`フックでアカウント作成自体を拒否する(公式に文書化されているallowlistパターン)。判定ロジック(`isEmailAllowed`)は純粋関数として切り出し、単体テストする。
  - この方式は「アカウント作成時」に一度だけ効く。既存ユーザーを後から`allowedEmails`で締め出したい場合は自動対応しない(個人用アプリのため、締め出したければユーザー行を手動で削除すればよい、という割り切り)。
- secret/baseURL/allowedEmails/Google認証情報などの実際の値は持たず、`app`から渡される。
- こちらも汎用アダプタは目指さず、使いやすさ優先で作る。
- better-auth CLIで生成するスキーマは`db`パッケージ側で取り込む（4章参照）。`auth`パッケージ自体はスキーマ/マイグレーションを持たない。

## 6. `cli`パッケージ（アプリ雛形・セット雛形の生成）

問題の追加は「MDファイルを書く」だけなので編集UIは不要。代わりに、定型作業(アプリの初期セットアップ、新しいセットのファイル作成・テーブルヘッダー・frontmatter)をCLIで省略する。

### `quiz create <app名>`

- `packages/templates/default`(実在するワークスペースパッケージ。`@quiz/core`/`@quiz/auth`/`@quiz/db`に実際に依存し、自身の型が通ることを保証している)を新しいディレクトリにコピーする。
- `package.json`の`name`フィールドと`wrangler.toml`のアプリ名プレースホルダーを、指定したapp名に置き換える。
- `node_modules`/`dist`/`.wrangler`はコピー対象から除外する。
- 既にディレクトリが存在する場合はエラーにして上書きしない。

### `quiz new <セット名>`

- `content/questions/<セット名>.md`を生成し、`title` frontmatterと空のテーブルヘッダー(`id | question | answer | explanation`)を書き込む。
- **セット名はサブディレクトリを含んでよい**(例: `english/part1` → `content/questions/english/part1.md`。ディレクトリが無ければ自動作成する)。frontmatterの`title`にはセット名の最後の階層(`part1`)を使う。
- `id`の接頭辞はセット名から機械的に導出しない(`react-hooks` → `react-hooks-001`のような採番はしない)。`id`は利用者が自由に書く欄のままにし、CLIは雛形の提示に留める。過剰な自動化はしない。
- 先頭が`/`のセット名や`..`を含むセット名は拒否する(意図しないパスへの書き込み防止)。
- 既存ファイルと同名の場合は上書きせずエラーにする。

### 実装方針

- CLIフレームワーク(commander等)は使わない。サブコマンドは2つ、引数も1つずつなので`process.argv`の手書き解析で十分。
- テンプレートコピーは`fs.cpSync(src, dest, { recursive: true, filter })`(Node組み込み)を使い、自前の再帰コピー処理を書かない。
- Node 24のネイティブTypeScript実行(`node src/index.ts`)でそのまま動く。相対importには`.ts`拡張子を明示する(Node ESMの解決はTypeScriptと違い拡張子省略を許さないため)。

## 7. `app`側に必要なもの（最小限）

`quiz.config.ts`のような単一の設定ファイルは持たない。ビルド時の関心(`contentDir`・Cloudflare向けビルド設定)と実行時の関心(`db`/`auth`)を分けて、それぞれ必要な場所で直接組み立てる。実際にビルド・検証して初めて分かった制約がいくつかあるため、それも含めて記す。

```ts
// waku.config.ts — 公式ガイド(https://waku.gg/guides/cloudflare)準拠
import { cloudflare } from "@cloudflare/vite-plugin";
import { quizContentPlugin } from "@quiz/core";
import { defineConfig } from "waku/config";

export default defineConfig({
  vite: {
    environments: {
      rsc: {
        optimizeDeps: { include: ["hono/tiny"] },
        build: {
          rolldownOptions: { platform: "neutral", external: ["cloudflare:workers"] },
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
```

```tsx
// src/waku.server.tsx — waku標準のentriesファイル。API route登録とCloudflare envアクセスの実例
import { createAuth } from "@quiz/auth";
import { createStore, submitAnswer } from "@quiz/core";
import { createDb } from "@quiz/db";
import adapter from "waku/adapters/cloudflare";
import { createPages } from "waku/router/server";

type CloudflareEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

// D1のようなバインディング(オブジェクト)はwaku標準のgetEnv()では取得できない
// (文字列のenv varsしか通さない実装のため)。`cloudflare:workers`のenvを直接使う。
// ただし動的import必須(下の「実装上の注意」参照)。
async function getQuizContext() {
  const { env } = (await import("cloudflare:workers")) as unknown as { env: CloudflareEnv };
  const db = createDb(env.DB);
  return {
    store: createStore(db),
    auth: createAuth({
      db,
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      allowedEmails: ["allow@example.com"],
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    }),
  };
}

const pages = createPages(async ({ createApi }) => {
  createApi({
    path: "/api/submit-answer",
    render: "dynamic",
    handlers: {
      POST: async (request) => {
        const { store, auth } = await getQuizContext();
        return submitAnswer(request, { store, auth });
      },
    },
  });
  return [];
});

// createPages()の戻り値はCloudflareアダプタでラップして初めて.build/.fetchを持つ
// 実際のエントリになる(ラップし忘れると内部ビルドで"build is not a function"になる)。
export default adapter(pages);
```

**実装上の注意(実際にビルドして踏んだ制約)**:
- `cloudflare:workers`は**モジュールのトップレベルでstatic importしない**。`@cloudflare/vite-plugin`はdev/build中のリクエスト処理をworkerd上で実行してくれるが、ビルド後の静的生成(SSG)ステップはビルド成果物を素のNodeで読み込むため、トップレベルimportだとその時点で解決できずクラッシュする(`ERR_UNSUPPORTED_ESM_URL_SCHEME`)。リクエストハンドラ内で動的importする。
- `waku.config.ts`の`vite.environments.rsc.build.rolldownOptions.external`に`"cloudflare:workers"`を明示しないと、そもそもバンドル時に解決エラーになる。
- `src/waku.server.tsx`のデフォルトエクスポートは`createPages(...)`の戻り値をそのまま使わず、`waku/adapters/cloudflare`の`adapter()`でラップする。

- `content/questions/**/*.md`
- `waku.config.ts`(上記)
- `src/waku.server.tsx`(上記。`quiz create`のテンプレートに含まれる)
- `wrangler.toml`（D1バインディング定義）
- マイグレーション適用(`pnpm db:migrate`)を**手動で**実行する（自動化しない。8章参照）

## 8. CI/CD

### GitHub Actions（CIのみ）

- トリガー: `content/questions/**.md` を含むPR
- 処理: テーブルパース検証、`id`の**全MDファイル横断**での重複チェック、必須列の空値チェック
- デプロイジョブは持たない

### デプロイ

- Cloudflare Pages/Workers をリポジトリに直接Git連携し、mainへのpushで自動デプロイ
- ビルド時に`core`のContent Layerが`content/questions/**.md`を静的データ化してバンドル
- **D1マイグレーションはこの自動デプロイに含めない**。スキーマ変更時は`pnpm db:migrate`を手動実行してから、コードをpushする運用にする（本体アプリのデプロイとマイグレーション適用は完全に分離する）。

## 9. UI設計方針

- **Notionライクな、ノイズの少ないUI**。色数を絞り、単色に近い統一感のある配色にする（アクセントカラーは1色程度）。
- 装飾的なボタン・アイコンを増やさない。**1画面に置くインタラクティブ要素(ボタン・リンク・入力)は多くても5〜7個**に収める。
- コンテンツの編集UIは作らない(問題はMDファイルの編集で完結するため、アプリ側にCRUD画面は不要。これによりUIの複雑さが最初から大きく減っている)。
- 画面構成の目安: セット一覧(セットごとの正答率と「開始」導線のみ) → モード選択(4択/フラッシュカード、全問/苦手問題のみ) → 出題画面(問題・選択肢/カードと最小限の操作のみ)。

## 10. ドキュメントサイト（docsを一つのプロダクトとして）

- `apps/docs`としてmonorepo内に独立させ、Cloudflare Pagesに別デプロイする（本体アプリとは別サイト）。
- フレームワーク: **Astro Starlight**
  - Mermaid対応が`astro-mermaid`という活発にメンテされているプラグインで実現でき、VitePress側の`vitepress-plugin-mermaid`（依存崩壊で動作不安定）より安定
  - `astro-mermaid`はCloudflare公式ドキュメントサイト自体が採用しているパターンをベースにしており、「Cloudflareで動くMermaid対応の静的ドキュメント」の実績として最適
  - `@astrojs/cloudflare`アダプタで公式にCloudflareへのデプロイをサポート
  - Markdownベースで、この仕様書のような設計ドキュメントをそのまま資産にできる
- 内容: 本仕様書(SPEC.md → `spec.md`)・基本設計書(DESIGN.md → `design.md`)・アプリ構造(`core`/`app`の役割、monorepo構成)の説明・将来的な`core`のAPIドキュメントを、すべてこの1つのdocsサイトに集約する（`core`側に別途docsを持たせて参照する構成は、現段階では複雑化するだけなので採用しない。`core`をnpm公開する段になったら再検討）。

## 11. 今後決めること（オープン事項）

- [ ] `core`/`db`/`auth`/`cli`をmonorepo内packageのままにするか、早い段階でnpm公開するか
- [ ] 1回のセッションで出題する問題数・順序（シャッフルの粒度など）
- [ ] コンテンツの問題削除・ID変更時に孤立する`attempts`の扱い

### 意図的に受容するリスク（個人用の単一ユーザーアプリのため）

- 複数タブを同時に開いて回答した場合の、localStorage再送処理の競合
- ブラウザのクラッシュ・強制終了時に、送信直前の回答が失われる可能性（`fetch(keepalive: true)`はベストエフォート）
- オフラインで大量に回答した場合の`localStorage`容量超過

## 12. 参考にした事例

- [VitePress](https://vitepress.dev/) — 設定 + Markdownでサイトが組み上がる体験（`core`の設計思想の参考）
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — Sources → Loaders → 型付きデータのパイプライン設計
- [Astro Starlight](https://starlight.astro.build/) / [astro-mermaid](https://www.npmjs.com/package/astro-mermaid) — docsサイトの採用フレームワーク。Cloudflare公式ドキュメントと同じ構成パターン
- [better-auth](https://www.better-auth.com/) — 本体がスキーマを公開し、利用側がDB接続を用意するパッケージ分割の参考
