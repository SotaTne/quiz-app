---
name: ffmpeg
description: markitdown や whisper に渡す前処理として、ローカルの音声・動画を FFmpeg と ffprobe で調査、変換、抽出、分割、画像化、検証する。単独の最終変換成果物を作るためではなく、後続の文書化・文字起こしを成功させるために使用する。
---

# FFmpeg メディア前処理

この skill は単独で授業内容を要約したり、最終的な Markdown を作成したりするものではない。主に `markitdown` または `whisper` を使う前の布石として、入力メディアの確認・正規化・分割を行う。

インストール済みの `ffmpeg` と `ffprobe` を通常のコマンドとして直接使用する。コマンドが見つからない場合だけ `mise exec` を使用する。

## 基本手順

1. 最初に `ffprobe -v error -show_format -show_streams FILE` でメディア情報を確認する。
2. 元ファイルは変更せず、生成物は名前の分かる出力ディレクトリへ保存する。
3. 後続処理が MP3/MP4 を直接扱える場合は、不要な変換をしない。
4. 文字起こしや markitdown の入力として必要な場合だけ、モノラル・16 kHz の WAV に変換する。

```bash
ffmpeg -y -i input.mp3 -vn -ac 1 -ar 16000 -c:a pcm_s16le output.wav
```

5. 長時間録音は、後続処理のメモリ・再試行・進捗管理に必要な場合だけ、元ファイルを削除せず連番のチャンクへ分割する。

```bash
ffmpeg -i input.mp3 -f segment -segment_time 1800 -reset_timestamps 1 -c:a pcm_s16le chunks/part-%03d.wav
```

6. 講義スライドや黒板を確認する場合は、一定間隔のスクリーンショットまたはコンタクトシートを作る。これは音声内容の代用ではなく、markitdown/whisper の結果を補足・検証するために使う。

```bash
ffmpeg -i video.mp4 -vf "fps=1/300,scale=1280:-1" frames/frame-%03d.jpg
```

生成した前処理ファイルを後続の `markitdown` または `whisper` に渡し、最終的な文字起こし・文書化はそれらの skill で行う。再生時間、ストリーム、コーデック、サンプルレート、変換エラーを報告する。メタデータや映像だけを根拠に、音声内容を理解したと主張してはいけない。
