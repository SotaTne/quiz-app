declare module "virtual:quiz-content" {
  import type { QuestionSet } from "@quiz/core";

  const questionSets: QuestionSet[];
  export default questionSets;
}
