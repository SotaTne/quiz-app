import { Anchor, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import type { Mode } from "../domain/attempt.ts";
import type { Question, QuestionSet } from "../domain/question.ts";
import { generateDistractors } from "../distractors/generate-distractors.ts";
import { applyFilter, type FilterType } from "../filters/apply-filter.ts";
import { checkAnswer } from "../grading/check-answer.ts";
import type { QuestionAccuracy } from "../store.ts";
import { PracticeView } from "./practice-view.tsx";
import { QuestionListView, type QuestionAccuracyStat } from "./question-list-view.tsx";
import { flushPendingAttempts, submitAnswer } from "./submit-answer-client.ts";

type AttemptEntry = [string, { isCorrect: boolean }];
type AccuracyEntry = [string, QuestionAccuracy];
type View = "list" | "practice";
/** ページ滞在中に答えたもの全部(モード別)。モード/絞り込みを切り替えても消えない、一覧表示専用の記録。 */
type SessionAnswer = { mode: Mode; questionId: string; isCorrect: boolean };

export type QuizSessionProps = {
  userId: string;
  set: QuestionSet;
  allSets: QuestionSet[];
  quizAttempts: AttemptEntry[];
  flashcardAttempts: AttemptEntry[];
  quizAccuracy: AccuracyEntry[];
  flashcardAccuracy: AccuracyEntry[];
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const atI = result[i];
    const atJ = result[j];
    if (atI === undefined || atJ === undefined) continue;
    result[i] = atJ;
    result[j] = atI;
  }
  return result;
}

/**
 * セット単位の演習画面。問題一覧(モード/絞り込み切り替え + 好きな問題から開始)と、
 * 1問ずつ進める演習画面(戻る/スキップ付き)を行き来する。
 *
 * このページ滞在中に答えた内容は2つの独立した目的で使い分ける:
 * - `allAnswers`(このページ内の全履歴・モード別・追記のみ): 問題一覧の表示・絞り込みに使う。
 *   モードやフィルタタブを切り替えても消えてはいけない(切り替えるたびにリセットしていたのが前回のバグ)。
 * - `passAnswers`(今の演習1周分・questionIdごとに1件・上書き): 演習中の「正答率」バッジと
 *   「間違えた問題だけもう一度」に使う。新しい演習を始めるたびにリセットする。
 *
 * 練習中のデッキ(practiceDeck)は開始した瞬間の中身で固定する。そうしないと、
 * 例えば「間違えた問題のみ」で練習中に正解した瞬間その問題が絞り込みから外れて
 * デッキから消え、正誤フィードバック画面が表示される前に次の問題へ飛んでしまう。
 */
export function QuizSession({
  userId,
  set,
  allSets,
  quizAttempts,
  flashcardAttempts,
  quizAccuracy,
  flashcardAccuracy,
}: QuizSessionProps) {
  const [mode, setMode] = useState<Mode>("flashcard");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [view, setView] = useState<View>("list");
  const [practiceDeck, setPracticeDeck] = useState<Question[]>([]);
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState<{ isCorrect: boolean } | null>(null);
  const [allAnswers, setAllAnswers] = useState<SessionAnswer[]>([]);
  const [passAnswers, setPassAnswers] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    flushPendingAttempts(userId);
  }, [userId]);

  const latestAttempt = useMemo(
    () => new Map(mode === "quiz" ? quizAttempts : flashcardAttempts),
    [mode, quizAttempts, flashcardAttempts],
  );
  const accuracy = useMemo(
    () => new Map(mode === "quiz" ? quizAccuracy : flashcardAccuracy),
    [mode, quizAccuracy, flashcardAccuracy],
  );

  // サーバーから読み込んだ全履歴の正答率に、このページ内で答えた分(今のモードだけ)を上乗せする
  // (ページを読み込み直さなくても一覧の表示・絞り込みが最新の結果を反映するように)。
  const liveAccuracy = useMemo(() => {
    const merged = new Map(accuracy);
    for (const answer of allAnswers) {
      if (answer.mode !== mode) continue;
      const current = merged.get(answer.questionId) ?? { total: 0, correct: 0 };
      merged.set(answer.questionId, {
        total: current.total + 1,
        correct: current.correct + (answer.isCorrect ? 1 : 0),
      });
    }
    return merged;
  }, [accuracy, allAnswers, mode]);

  // 同様に、このページ内の回答を「直近の回答」としてサーバーの値より優先する(配列の後ろほど新しい)。
  const liveLatestAttempt = useMemo(() => {
    const merged = new Map(latestAttempt);
    for (const answer of allAnswers) {
      if (answer.mode !== mode) continue;
      merged.set(answer.questionId, { isCorrect: answer.isCorrect });
    }
    return merged;
  }, [latestAttempt, allAnswers, mode]);

  // 問題一覧に表示する問題(常に最新の絞り込み条件で計算し直す)。
  const listQuestions = useMemo(
    () => applyFilter(filterType, set.questions, liveLatestAttempt, liveAccuracy),
    [filterType, set.questions, liveLatestAttempt, liveAccuracy],
  );

  const question = practiceDeck[position];

  const choices = useMemo(() => {
    if (mode !== "quiz" || !question) return null;
    const distractors = generateDistractors(question, set, allSets);
    if (!distractors) return null;
    return shuffle([question.answer, ...distractors]);
  }, [mode, question, set, allSets]);

  function resetPass() {
    setPosition(0);
    setResult(null);
    setPassAnswers(new Map());
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    resetPass();
  }

  function handleFilterChange(next: FilterType) {
    setFilterType(next);
    resetPass();
  }

  /** 一覧の「始める」: 今表示されている絞り込み結果を、その場でデッキとして固定して始める。 */
  function handleStartAll() {
    resetPass();
    setPracticeDeck(listQuestions);
    setView("practice");
  }

  /** 一覧の各行クリック: その1問だけをやって終わる(続けて他の問題には進まない)。 */
  function handleStartQuestion(questionId: string) {
    const target = set.questions.find((candidate) => candidate.id === questionId);
    resetPass();
    setPracticeDeck(target ? [target] : []);
    setView("practice");
  }

  function recordAnswer(isCorrect: boolean) {
    if (!question) return;
    setAllAnswers((current) => [...current, { mode, questionId: question.id, isCorrect }]);
    setPassAnswers((current) => {
      const next = new Map(current);
      next.set(question.id, isCorrect);
      return next;
    });
    submitAnswer({ userId, questionId: question.id, mode, isCorrect });
  }

  function handleAnswerQuiz(selected: string) {
    if (!question) return;
    const isCorrect = checkAnswer(question, selected);
    recordAnswer(isCorrect);
    setResult({ isCorrect });
  }

  function handleAnswerFlashcard(isCorrect: boolean) {
    recordAnswer(isCorrect);
    setResult(null);
    setPosition((current) => current + 1);
  }

  function handleNext() {
    setResult(null);
    setPosition((current) => current + 1);
  }

  function handlePrev() {
    setResult(null);
    setPosition((current) => Math.max(0, current - 1));
  }

  function handleRetryWrong() {
    const wrongIds = new Set(
      [...passAnswers.entries()].filter(([, isCorrect]) => !isCorrect).map(([id]) => id),
    );
    setPracticeDeck(set.questions.filter((candidate) => wrongIds.has(candidate.id)));
    setPosition(0);
    setResult(null);
    setPassAnswers(new Map());
  }

  function accuracyOf(questionId: string): QuestionAccuracyStat {
    return liveAccuracy.get(questionId) ?? null;
  }

  const wrongCount = [...passAnswers.values()].filter((isCorrect) => !isCorrect).length;

  return (
    <Stack gap="lg">
      <Anchor href="/" size="sm">
        一覧に戻る
      </Anchor>
      <Text fw={700} size="xl">
        {set.title}
      </Text>

      {view === "list" ? (
        <QuestionListView
          mode={mode}
          onModeChange={handleModeChange}
          filterType={filterType}
          onFilterChange={handleFilterChange}
          questions={listQuestions}
          accuracyOf={accuracyOf}
          onStartAll={handleStartAll}
          onStartQuestion={handleStartQuestion}
        />
      ) : (
        <PracticeView
          mode={mode}
          question={question}
          position={position}
          total={practiceDeck.length}
          choices={choices}
          result={result}
          sessionAnswered={passAnswers.size}
          sessionCorrect={[...passAnswers.values()].filter(Boolean).length}
          wrongCount={wrongCount}
          onBackToList={() => setView("list")}
          onPrev={handlePrev}
          onSkip={handleNext}
          onNext={handleNext}
          onAnswerQuiz={handleAnswerQuiz}
          onAnswerFlashcard={handleAnswerFlashcard}
          onRetryWrong={handleRetryWrong}
        />
      )}
    </Stack>
  );
}
