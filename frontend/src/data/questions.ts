export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number; // index
}

export const MOCK_QUESTIONS: Record<number, Question> = {
  3: {
    id: 1,
    text: "What keyword is used to define a function in Go?",
    options: ["def", "func", "function", "fn"],
    correctAnswer: 1
  },
  4: {
    id: 2,
    text: "Which of these is NOT a basic type in Go?",
    options: ["bool", "string", "int", "decimal"],
    correctAnswer: 3
  },
  5: {
    id: 3,
    text: "How do you declare a variable in Go?",
    options: ["var x int", "int x", "x := int", "declare x"],
    correctAnswer: 0
  },
  6: {
    id: 4,
    text: "What is the zero value of a boolean in Go?",
    options: ["true", "false", "nil", "0"],
    correctAnswer: 1
  },
  7: {
    id: 5,
    text: "Which keyword starts a goroutine?",
    options: ["async", "await", "go", "start"],
    correctAnswer: 2
  }
};
