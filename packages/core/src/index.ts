export type { Question, QuestionSet } from "./domain/question";
export type { Attempt, Mode } from "./domain/attempt";

export { buildQuestionSet } from "./content/build-question-set";
export type { BuildQuestionSetResult } from "./content/build-question-set";

export { deriveSetId } from "./content/derive-set-id";

export { loadQuestionSets } from "./content/load-question-sets";
export type { LoadQuestionSetsResult } from "./content/load-question-sets";

export { quizContentPlugin } from "./vite-plugin";
export type { QuizContentPluginOptions, QuizContentVitePlugin } from "./vite-plugin";

export { generateDistractors } from "./distractors/generate-distractors";

export { applyFilter } from "./filters/apply-filter";
export type { FilterType } from "./filters/apply-filter";

export { checkAnswer } from "./grading/check-answer";

export { attempts } from "./schema";

export { createStore } from "./store";
export type { Database, RecordAttemptInput, Store } from "./store";

export { SetListView } from "./pages/set-list-view";
export type { SetListViewProps, SetSummary } from "./pages/set-list-view";

export { FlashcardView } from "./pages/flashcard-view";
export type { FlashcardViewProps } from "./pages/flashcard-view";

export { FourChoiceView } from "./pages/four-choice-view";
export type { FourChoiceViewProps } from "./pages/four-choice-view";

export { submitAnswer } from "./actions/submit-answer";
export type { AuthLike, SubmitAnswerDeps } from "./actions/submit-answer";

export { parseSubmitAnswerInput } from "./actions/parse-submit-answer-input";
export type { ParseSubmitAnswerInputResult, SubmitAnswerInput } from "./actions/parse-submit-answer-input";
