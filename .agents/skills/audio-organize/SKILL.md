---
name: audio-organize
description: data 以下の授業フォルダにある audio.mp4 をパス順に 01audio.mp4、02audio.mp4 のようにリネームし、元フォルダのファイルを残したまま apps/app/data/audios にコピーする。音声形式は変換しない。
---

# 授業音声の連番化とコピー

授業録画を、後続の whisper や markitdown で扱いやすくするために整理する。これは音声コーデックを変換する処理ではなく、ファイル名の変更とコピーを行う処理である。

## 実行規則

1. 対象は `apps/app/data` 以下の各授業フォルダにある、名前が完全に `audio.mp4` のファイルだけにする。
2. `apps/app/data/audios` 自体は検索対象から除外する。
3. フルパスの辞書順に並べ、最初を `01audio.mp4`、次を `02audio.mp4` とする。番号は2桁で、対象数に応じて増やす。
4. 元の授業フォルダ内で `audio.mp4` を対応する連番名にリネームする。
5. リネーム後のファイルを `apps/app/data/audios/` にコピーする。移動ではないため、元フォルダと集約フォルダの両方にファイルを残す。
6. ファイルの内容、拡張子、コーデックは変更しない。MP3への変換や再エンコードは行わない。
7. 既に連番化済みの場合は、二重に番号を付けない。対象と番号の対応を確認してから実行する。
8. コピー先に同名ファイルがある場合は、元ファイルとサイズやハッシュを確認し、無断で上書きしない。

## macOS / zsh の基本例

対象を確定してから、次のように実行する。パスに日本語や空白が含まれるため、必ず引用符を使う。

```zsh
mkdir -p apps/app/data/audios
n=1
while IFS= read -r dir; do
  num=$(printf '%02d' "$n")
  mv "$dir/audio.mp4" "$dir/${num}audio.mp4"
  cp "$dir/${num}audio.mp4" "apps/app/data/audios/${num}audio.mp4"
  n=$((n + 1))
done < <(
  find apps/app/data -type f -name 'audio.mp4' \
    -not -path 'apps/app/data/audios/*' \
    -exec dirname {} \; | sort
)
```

## 検証

処理後、次を確認する。

```zsh
find apps/app/data -type f -name 'audio.mp4' -not -path 'apps/app/data/audios/*'
find apps/app/data/audios -maxdepth 1 -type f -name '[0-9][0-9]audio.mp4' | sort
```

元フォルダの連番ファイル数と `audios/` のコピー数が一致すること、元ファイルとコピーのサイズが一致することを報告する。音声内容の文字起こしや授業ノート作成は、この skill では行わず `whisper` または `markitdown` に引き渡す。
