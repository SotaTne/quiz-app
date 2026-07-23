# クイズの追加方法

`content/questions/` 配下に Markdown ファイルを置くと、それがそのまま1つの「セット」になります。
アプリ側のコード変更は不要です。

## 書き方

```markdown
---
title: セットのタイトル
---

| id | question | answer | explanation |
|----|----------|--------|-------------|
| q1 | 問題文   | 答え   | 解説(任意)  |
| q2 | 問題文2  | 答え2  |              |
```

- `id`: セット内で一意な文字列(必須)
- `question` / `answer`: 問題文・答え(必須)
- `explanation`: 解説。空欄でもよい
- `answer`は4択の選択肢生成にも使われる(同じセット内の他の答え、足りなければ他セットの答えから補う)

## ファイルの置き場所とセットID

ファイルパスがそのままセットID(URL `/sets/<setId>`)になる。

| ファイル                                     | セットID          |
| --------------------------------------------- | ------------------ |
| `content/questions/example.md`                | `example`          |
| `content/questions/english/part1.md`          | `english/part1`     |

サブディレクトリを切れば階層構造になる。ディレクトリは自動で認識されるので、フォルダを作って `.md` を置くだけでよい。

## 動作確認

`pnpm dev` を起動した状態でファイルを保存すると、ホットリロードで一覧に反映される。

# フォルダ構成

```
apps/app/
├── app/                     # React Router のアプリ本体(ルーティングは薄く、実体は@quiz/coreにある)
│   ├── root.tsx             # 最上位レイアウト(<html>・Mantine Provider)
│   ├── routes.ts            # ルート定義(path -> ファイルの対応)
│   ├── routes/               # 各ルートのloader/action(実際の画面は@quiz/coreのコンポーネントを呼ぶだけ)
│   ├── context.ts           # Cloudflare bindingsをRouterContextProviderで受け渡すための定義
│   └── quiz-context.ts      # env(D1・secrets)からstore/authを組み立てる
├── workers/app.ts           # Cloudflare Workersのエントリポイント
├── content/questions/       # ここにMarkdownを置くとセットになる(このREADMEの本題)
├── migrations/              # D1のマイグレーション(`pnpm db:generate`で生成)
├── drizzle.config.ts        # マイグレーション生成の設定(スキーマ定義自体は@quiz/dbが持つ)
├── wrangler.toml            # Cloudflare Workersの設定(D1バインディング等)
├── .dev.vars                # ローカル用の秘密情報(gitignore対象。本番はwrangler secretで渡す)
└── vite.config.ts / react-router.config.ts
```

## 主なコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | ローカル開発サーバー起動(起動前にD1のマイグレーションを自動適用) |
| `pnpm build` | 本番ビルド |
| `pnpm deploy` | ビルドしてCloudflare Workersにデプロイ |
| `pnpm db:generate` | スキーマ変更からマイグレーションファイルを生成 |
| `pnpm db:migrate` | ローカルD1にマイグレーションを適用 |
| `pnpm typecheck` | 型チェック |
