export type Mode = "quiz" | "flashcard";

export type Attempt = {
  id: string;
  userId: string;
  questionId: string;
  mode: Mode;
  isCorrect: boolean;
  answeredAt: Date;
};
