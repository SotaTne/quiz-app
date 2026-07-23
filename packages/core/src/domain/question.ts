export type Question = {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
};

export type QuestionSet = {
  id: string;
  title: string;
  questions: Question[];
};
