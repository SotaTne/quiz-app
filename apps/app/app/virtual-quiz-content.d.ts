declare module "virtual:quiz-content" {
  import type { QuestionSet } from "@quiz/core";

  const questionSets: QuestionSet[];
  export default questionSets;
}

declare module "virtual:paper-content" {
  import type { Paper } from "@quiz/core";

  const papers: Paper[];
  export default papers;
}
