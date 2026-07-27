---
name: whisper
description: OpenAI Whisper を使ってローカルの音声・動画、特に日本語講義を文字起こしする。MP3/MP4/WAV、時刻付き文字起こし、字幕、講義ノート作成で使用する。
---

# OpenAI Whisper による文字起こし

Whisper は OpenAI のオープンソースで、ローカル実行できる音声認識モデルである。個人情報を含む録音や長時間録音では、ネットワーク依存の音声認識サービスより優先して使用する。

Apple Silicon Mac では PyTorch の MPS（Metal Performance Shaders）を優先する。最初に次で確認する。

```bash
uvx --from openai-whisper python -c 'import torch; print(torch.backends.mps.is_available())'
```

`True` なら CLI に `--device mps` を指定する。MPS が利用できない場合だけ `--device cpu` を使用する。Whisper の自動判定は CUDA がなければ CPU を選ぶことがあるため、Apple Silicon ではデバイスを明示する。

## モデルの選択

- 標準は `turbo`（`large-v3-turbo`）。高速な多言語文字起こしに適している。
- 日本語や聞き取りにくい音声で精度を優先する場合は、メモリが許せば `large-v3` または `large` を使用する。
- メモリが少ない場合は `medium`、次に `small` を使用する。
- 日本語では `.en` の英語専用モデルを使用しない。

`--model turbo`、`--model large-v3` のようにモデルを明示指定できる。初回実行時はモデルの重みをダウンロードするため、その旨を報告する。`turbo` は文字起こし用であり、日本語から英語への翻訳には適さない。

## CLI の手順

MarkItDown の外部音声認識に依存せず、次のように実行する。

```bash
uvx --from openai-whisper whisper input.mp3 \
  --model turbo --language Japanese --task transcribe --device mps \
  --output_dir transcript --output_format all
```

CLI が使えない場合は、同じパッケージを Python から使用する。音声の正規化や分割が必要な場合だけ FFmpeg を使用する。Whisper は30秒のスライディングウィンドウで処理するため長時間ファイルを必ず分割する必要はないが、再試行、メモリ使用量、進捗確認のために分割してもよい。MPS で演算エラーが出る場合は CPU に切り替えて再試行する。

## 品質上の要件

- 日本語講義では `--language Japanese` を指定する。
- `--task transcribe` を使用し、翻訳しない。
- Apple Silicon では `--device mps` を指定し、MPS が使えない場合のみ `--device cpu` にする。
- `.json` や `.srt` の時刻情報を保持し、 raw transcript も残す。
- 専門講義では、既知の授業用語を initial prompt に含めてもよい。ただし不確かな発話を黙って修正してはいけない。
- 信頼度が低い、聞き取れない、または曖昧な箇所は `[聞き取り不明]` と記載する。
- 逐語的な文字起こしと、要約・解釈を明確に分ける。

## 成果物

文字起こし後は、映像からの推測ではなく transcript をもとにノートを作成する。元録音、モデル名、言語、処理状況を記載する。日本語講義の用語表には、専門用語、略語、英単語、固有名詞、例、聞き取り候補を Markdown 表で含める。
