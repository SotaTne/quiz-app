# 基本設計書 (v0.1)

対象: [SPEC.md](./SPEC.md) で確定した仕様のUML図。

## 1. システム構成図

```mermaid
graph TD
    subgraph Build["ビルド時"]
        MD["content/questions/**/*.md<br/>(1ファイル=1セット、サブディレクトリで分類可)"]
        VitePlugin["core: vite-plugin<br/>(MDパース→仮想モジュール)"]
        MD --> VitePlugin
    end

    subgraph CF["Cloudflare"]
        Worker["waku App (RSC)<br/>Cloudflare Workers"]
        D1[("D1: attempts<br/>(coreが公開するschema)")]
        Worker <--> D1
    end

    subgraph Ext["外部サービス"]
        Google["Google OAuth"]
    end

    VitePlugin -->|"バンドルに含まれる"| Worker
    Browser["ブラウザ"] <--> Worker
    Worker <--> Google

    subgraph CI["GitHub Actions"]
        Validate["content validation<br/>(PR時のみ / デプロイなし)"]
    end
    Repo["GitHub Repository"] -->|PR| Validate
    Repo -->|push main| Worker

    subgraph Manual["手動運用（自動化しない）"]
        Migrate["pnpm db:migrate<br/>(スキーマ変更時に手動実行)"]
    end
    Migrate --> D1

    subgraph Docs["packages/docs (別デプロイ)"]
        Starlight["Astro Starlight静的サイト"]
    end
    Repo -->|push main| Starlight
```

D1マイグレーションは本体アプリの自動デプロイ経路に含めない。スキーマ変更時のみ、開発者が`pnpm db:migrate`を手動実行してからコードをpushする（4章参照）。

## 2. モノレポ構成図

better-authの設計を参考に、`core`がDrizzleスキーマとStore実装を公開し、`db`/`auth`はその上で「自分が使いやすいように」組み立てるパッケージという位置づけにする。

```mermaid
graph TD
    Root["quiz-app/"]
    Root --> Core["packages/core<br/>(フレームワーク本体)"]
    Root --> Db["packages/db<br/>(D1接続・マイグレーション、自分用)"]
    Root --> Auth["packages/auth<br/>(better-auth設定、自分用)"]
    Root --> Cli["packages/cli<br/>(アプリ雛形・セット雛形の生成)"]
    Root --> Templates["packages/templates/default<br/>(quiz createがコピーする実パッケージ)"]
    Root --> App["packages/app<br/>(自分の本番アプリ)"]
    Root --> Docs["packages/docs<br/>(Astro Starlight)"]

    Core --> C1["content/ MDパーサー・スキーマ検証・deriveSetId()"]
    Core --> C2["vite-plugin/ 仮想モジュール化"]
    Core --> C3["distractors/ 誤答生成"]
    Core --> C4["filters/ 出題フィルタ(全問/苦手問題のみ)"]
    Core --> C5["pages/ waku RSCページ（カスタマイズ可）"]
    Core --> C6["schema.ts 公開Drizzleスキーマ(attempts)"]
    Core --> C7["store.ts schemaに対応するStore実装"]
    Core --> C10["actions/ submitAnswer(1問ごと即時) Server Action"]
    Core ==依存==> Auth

    Db --> D1S["schema.ts core.attempts + better-auth生成スキーマを統合"]
    Db --> D1M["migrations/ drizzle-kit生成（唯一の適用先）"]
    Db --> D1C["client.ts D1接続の組み立て"]
    Db -.importする.-> C6

    Auth --> A1["auth.ts better-auth + Google + allowlist"]
    Auth -.スキーマはdbが取り込む.-> D1S

    Cli --> CL1["create-app.ts `quiz create <name>` : templates/defaultをコピー"]
    Cli --> CL2["new-set.ts `quiz new <name>` : content/questions/にMD雛形を生成(階層可)"]
    Cli -.コピー元.-> Templates

    Templates --> T1["waku.config.ts (quizContentPluginを直接登録)"]
    Templates --> T3["wrangler.toml"]
    Templates --> T2["content/questions/example.md"]
    Templates -.依存(型チェック対象).-> Core
    Templates -.依存(型チェック対象).-> Auth
    Templates -.依存(型チェック対象).-> Db

    App --> AP2["content/questions/**/*.md (階層可、例: english/part1.md)"]
    App --> AP3["waku.config.ts (quizContentPluginを直接登録)"]
    App --> AP4["wrangler.toml"]

    App -.依存.-> Core
    App -.依存.-> Db
    App -.依存.-> Auth
    Docs -.参照.-> SpecFiles["SPEC.md / DESIGN.md"]
```

## 3. ER図（D1）

問題データはD1に持たない。ユーザーの学習記録(`attempts`、`core`が公開するスキーマ)とbetter-auth標準テーブル(`auth`パッケージが管理)のみ。

```mermaid
erDiagram
    USER ||--o{ SESSION : "has"
    USER ||--o{ ACCOUNT : "has"
    USER ||--o{ ATTEMPTS : "answers"

    USER {
        string id PK
        string email
        string name
    }
    SESSION {
        string id PK
        string userId FK
        timestamp expiresAt
    }
    ACCOUNT {
        string id PK
        string userId FK
        string providerId
    }
    ATTEMPTS {
        string id PK
        string userId FK
        string questionId "MD側のid（外部参照、FK制約なし）"
        string mode "quiz | flashcard"
        boolean isCorrect
        timestamp answeredAt
    }
```

`db`パッケージは`ATTEMPTS`とbetter-auth標準テーブル(`USER`/`SESSION`/`ACCOUNT`)を1つの`schema.ts`にまとめ、単一のマイグレーション履歴で管理する（別々のマイグレーションフローにしない）。

## 4. クラス図（coreのドメインモデル）

```mermaid
classDiagram
    class Store {
        +recordAttempt(attempt) void
        +listAttempts(userId) Attempt[]
    }

    class QuestionSet {
        +string id
        +string title
        +Question[] questions
    }

    class Question {
        +string id
        +string question
        +string answer
        +string explanation
    }

    class Attempt {
        +string id
        +string userId
        +string questionId
        +string mode
        +boolean isCorrect
        +Date answeredAt
    }

    class DistractorGenerator {
        +generate(question, set, allSets) string[] | null
    }

    class QuestionFilter {
        +apply(mode, filterType, questions, latestAttempts) Question[]
    }

    class RetryStore {
        +saveFailed(entry) void
        +listPending() Entry[]
        +clear(id) void
    }

    class SubmitAnswerAction {
        +submitAnswer(session, id, questionId, mode, isCorrect) void
    }

    QuestionSet "1" *-- "many" Question : contains
    DistractorGenerator ..> QuestionSet : samples from (self excluded, deduped)
    QuestionFilter ..> Attempt : reads latest per questionId+mode
    Attempt --> Question : references by id (loose)
    Store ..> Attempt : persists via core.schema(attempts)
    SubmitAnswerAction ..> Store : calls recordAttempt (INSERT OR IGNORE by id, internal only)
    SubmitAnswerAction ..> Auth : reads session for userId
    RetryStore ..> SubmitAnswerAction : retries on next app load (localStorage, failures only)
```

- `Store`は`core/src/schema.ts`で公開される`attempts`テーブルに対して直接動く（DB非依存の抽象インターフェースにはしない）。`db`パッケージは`Store`を満たすDrizzle接続を組み立てて`app`に渡すだけの役割。
- `Store.recordAttempt`は`SubmitAnswerAction`の内部からのみ呼ばれる。クライアントが直接呼び出せるAPIとしては公開しない。`id`はクライアント生成で、`INSERT OR IGNORE`により再送しても重複しない(冪等)。
- `isCorrect`はクライアント側で計算する（正解データは`QuestionSet`としてクライアントにも渡っているため、サーバー側で独立に再判定しない）。目的は改ざん防止ではなく、正誤の永続化と途中離脱からの再開。`userId`だけはサーバー側セッションから取得する。
- 4択・フラッシュカードとも同じ`SubmitAnswerAction`経路を通る（判定方法だけが異なり、記録経路は1本化されている）。バッチ化はせず1問ごとに`fetch(keepalive: true)`で即時送信し、失敗時のみ`RetryStore`(localStorage)に退避する。
- `RetryStore`のキーはログイン中の`userId`で名前空間化する(`retryQueue:${userId}`)。同じブラウザで別ユーザーがログインしても別の名前空間を見るため、他人の未送信回答と混ざらない。

## 5. シーケンス図: ログイン（Google OAuth + allowlist）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant App as waku App (RSC)
    participant Auth as auth package<br/>(better-auth, appからallowedEmails注入)
    participant Google

    User->>Browser: アプリにアクセス
    Browser->>App: GET /
    App->>Auth: セッション確認
    alt 未ログイン
        Auth-->>Browser: ログイン画面
        User->>Browser: 「Googleでログイン」
        Browser->>Google: OAuth認可リクエスト
        Google-->>Browser: 認可コード
        Browser->>Auth: コールバック(code)
        Auth->>Google: トークン交換
        Google-->>Auth: ユーザー情報(email)
        Auth->>Auth: allowedEmailsチェック
        alt 許可されたメール
            Auth-->>Browser: セッション発行
        else 許可されていない
            Auth-->>Browser: 拒否
        end
    end
    App-->>Browser: セット一覧を表示
```

## 6. シーケンス図: コンテンツビルドパイプライン

```mermaid
sequenceDiagram
    participant MD as content/questions/**/*.md
    participant Plugin as core: vite-plugin
    participant SetId as core: deriveSetId()
    participant Schema as core: schema検証
    participant VM as 仮想モジュール
    participant Page as waku RSC Page

    MD->>Plugin: ファイル変更検知 / ビルド開始(サブディレクトリ含め再帰的に収集)
    Plugin->>SetId: ファイルパスからsetIdを導出(例: english/part1.md → "english/part1")
    SetId-->>Plugin: setId
    Plugin->>Plugin: テーブルをパース
    Plugin->>Schema: 必須列(id/question/answer)を検証
    Schema-->>Plugin: 検証結果
    alt 検証エラー
        Plugin-->>Plugin: ビルドエラーとして中断
    else OK
        Plugin->>VM: 型付きQuestionSet[]を生成(setIdは階層を保持)
    end
    Page->>VM: import
    VM-->>Page: QuestionSet[]
```

## 7. シーケンス図: 出題〜記録（4択・フラッシュカード共通、即時送信）

目的は「サーバー側での厳密な正誤判定」ではなく、**(a)正誤の永続化**と**(b)途中離脱からの再開**。4択・フラッシュカードとも同じ記録経路(クライアント側で判定 → 即時送信 → 失敗時のみlocalStorageへ退避)に統一する。バッチ化はしない。

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Page as waku RSC Page(4択/flashcard)
    participant Filter as core: QuestionFilter
    participant Distractor as core: DistractorGenerator
    participant Retry as core: RetryStore<br/>(localStorage、失敗時のみ)
    participant Action as core: submitAnswer<br/>(Server Action)
    participant Auth as auth package
    participant Store as core: Store
    participant D1 as Cloudflare D1(attempts)

    User->>Page: セット選択 + モード(4択/flashcard) + フィルタ(全問/苦手問題のみ)
    Page->>Store: listLatestAttempts(userId, mode)
    Store->>D1: SELECT
    D1-->>Store: 最新attempts
    Store-->>Page: 最新attempts
    Page->>Filter: apply(mode, filterType, questions, attempts)
    Filter-->>Page: 出題対象の問題一覧（正解済みは自動的に除外＝再開の仕組み）

    opt アプリ起動時
        Page->>Retry: listPending()
        Retry-->>Page: 前回送信に失敗したentries
        Page->>Action: submitAnswer(entry) を再送
    end

    opt 4択の場合
        Page->>Distractor: generate(question, set)
        alt 誤答が3つ揃わない
            Distractor-->>Page: null(4択不可)
            Page-->>User: フラッシュカードのみで出題
        else 誤答3つ生成成功
            Distractor-->>Page: 誤答3つ
            Page-->>User: 4択問題を表示
        end
    end

    loop 1問答えるごと
        User->>Page: 回答（選択 or 知ってる/知らない）
        Page->>Page: id生成 + isCorrectをクライアント側で計算（正解データは既にクライアントにある）
        Page-->>User: 正誤 + 解説を即座に表示（送信を待たない）
        Page->>Action: fetch(keepalive:true) submitAnswer({ id, questionId, mode, isCorrect })
        alt 送信成功
            Action->>Auth: getSession(request)
            Auth-->>Action: { userId }
            Action->>Store: recordAttempt({ id, userId, questionId, mode, isCorrect })
            Store->>D1: INSERT OR IGNORE（idで冪等）
        else 送信失敗（オフライン等）
            Page->>Retry: saveFailed(entry)
        end
    end
```

`isCorrect`はクライアントが計算するが、`userId`は必ずサーバー側セッションから取得するため、記録が「誰の」ものかは偽装できない。次回セットを開いたとき、`listLatestAttempts`が既に正解した問題を除外するので、特別なセッション状態を持たなくても途中離脱からの再開になる。
