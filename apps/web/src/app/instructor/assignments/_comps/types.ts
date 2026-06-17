export type Batch = {
  id: string;
  name: string;
  course: { id: string; title: string };
};

export type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  type: "QUIZ" | "ASSIGNMENT";
  questionPdfUrl?: string | null;
  course: { title: string };
  batch: { name: string };
  _count?: { submissions: number; questions: number };
};

export type StudentSubmission = {
  id: string;
  studentId: string;
  status: "PENDING" | "GRADED";
  submittedAt: string;
  totalScore: number | null;
  grade: string | null;
  feedback: string | null;
  answerFileUrl?: string | null;
  student: { name: string; email: string };
};

export type SubmissionDetail = StudentSubmission & {
  assignment: {
    title: string;
    maxPoints: number;
    type: "QUIZ" | "ASSIGNMENT";
    questionPdfUrl?: string | null;
    questions: Array<{
      id: string;
      questionText: string;
      marks: number;
      options: Array<{ id: string; optionText: string; isCorrect: boolean }>;
    }>;
  };
  questionResponses: Array<{
    id: string;
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
};

export type FormQuestion = {
  questionText: string;
  marks: number;
  options: Array<{ optionText: string; isCorrect: boolean }>;
};

export const emptyFormQuestions = (): FormQuestion[] => [
  {
    questionText: "",
    marks: 1,
    options: [
      { optionText: "", isCorrect: true },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ],
  },
];
