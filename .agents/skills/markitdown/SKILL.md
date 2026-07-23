---
name: markitdown
description: PDF、Officeドキュメント、画像、音声、Webコンテンツ、構造化データなどを、LLMでの処理に最適化されたMarkdown形式に変換します。ドキュメントからのテキスト抽出、画像のOCR、音声の文字起こし、YouTubeの書き起こし、バッチ処理などに使用します。
---

# MarkItDown

## 概要

`markitdown` は、様々なファイル形式を Markdown に変換するためのユーティリティです。
構造（見出し、リスト、テーブル、ハイパーリンク）を維持したまま、トークン効率の良いクリーンな Markdown を生成し、LLM による分析や RAG（検索拡張生成）システムへの入力を容易にします。

## 利用シーン

以下のタスクを依頼された際にこのスキルを有効化してください：
- ドキュメント（PDF, Word, Excel, PowerPoint）を Markdown に変換したい
- 画像から OCR でテキストを抽出したい
- 音声ファイルをテキストに文字起こししたい
- YouTube 動画の書き起こしを取得したい
- HTML や EPUB などの Web コンテンツを Markdown に変換したい
- 構造化データ（CSV, JSON, XML）を読みやすい Markdown テーブルに変換したい

## 主な機能とコマンド例

実行には`uvx "markitdown[all]"` を使用します。

### 1. ドキュメント変換
PDFを変換します。

```bash
uvx "markitdown[all]" document.pdf -o output.md
```

### 2. メディア処理（OCR・文字起こし）
画像からのテキスト抽出や音声の文字起こしを行います。

```bash
uvx "markitdown[all]" image.png
uvx "markitdown[all]" audio.wav
```

### 3. Webコンテンツ・構造化データ
URL（YouTube等）からの抽出や、CSV/JSON/XML の変換を行います。

```bash
uvx "markitdown[all]" https://www.youtube.com/watch?v=VIDEO_ID
uvx "markitdown[all]" data.csv
```

## 注意事項

- 出力は標準出力、または `-o` オプションでファイルに保存できます。
- 非常に大きなファイルや複雑なレイアウトの PDF は、変換の精度が低下する場合があります。
- LLM がドキュメントの内容を理解・検索・要約する前段階として、このツールを積極的に活用してください。
