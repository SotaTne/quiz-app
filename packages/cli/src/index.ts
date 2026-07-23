#!/usr/bin/env node
import { basename } from "node:path";
import { createApp } from "./create-app.ts";
import { createQuestionSet } from "./new-set.ts";

const USAGE = "使い方: quiz create <app-name> | quiz new <set-name>";

function main(argv: string[]): void {
  const [command, name] = argv;

  if (command === "create" && name) {
    createApp(name, basename(name));
    console.log(`作成しました: ${name}/`);
    return;
  }

  if (command === "new" && name) {
    const filePath = createQuestionSet("content/questions", name);
    console.log(`作成しました: ${filePath}`);
    return;
  }

  console.error(USAGE);
  process.exitCode = 1;
}

main(process.argv.slice(2));
