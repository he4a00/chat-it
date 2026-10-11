import { tool } from "ai"
import { z } from "zod"

/**
 * 1. Multiple-Choice Quiz Tool
 * Generates an interactive quiz widget with diagnostic distractors and instant feedback.
 */
export const createQuizTool = tool({
  description:
    "Generate an interactive multi-question quiz challenge (default: 4 questions) with question numbering, sequential next/previous navigation, instant correctness checking, hints, and explanations.",
  inputSchema: z.object({
    topic: z.string().describe("STEM topic e.g. React Fundamentals, Quadratic Equations, Newton's Laws"),
    subject: z.string().describe("Broad subject/discipline, e.g. Mathematics, Physics, Computer Science, Chemistry"),
    title: z.string().optional().describe("Catchy title for the quiz challenge"),
    questions: z
      .array(
        z.object({
          id: z.string().describe("Unique question identifier, e.g. 'q1', 'q2', 'q3', 'q4'"),
          question: z
            .string()
            .describe("Clear question statement formatted with KaTeX math ($...$ or $$...$$) or code if applicable"),
          options: z
            .array(
              z.object({
                id: z.string().describe("Unique option ID, e.g. 'a', 'b', 'c', 'd'"),
                label: z.string().describe("Option text with LaTeX math or code snippets if applicable"),
                isCorrect: z.boolean().describe("Whether this option is the correct answer"),
                explanation: z.string().optional().describe("Why this choice is correct or incorrect"),
              }),
            )
            .min(2)
            .max(6)
            .describe("2 to 6 distinct multiple choice options for this question"),
          hint: z.string().optional().describe("Optional subtle hint for this question"),
          explanation: z.string().describe("Comprehensive pedagogical explanation of the correct solution"),
        }),
      )
      .min(1)
      .max(10)
      .describe(
        "Array of quiz questions. ALWAYS provide 4 questions by default (unless user explicitly requested a different count). ALL quiz questions MUST be in this array, NEVER output quiz questions as markdown text!",
      ),
    // Backward compatibility for legacy single-question payload:
    question: z.string().optional(),
    options: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          isCorrect: z.boolean(),
          explanation: z.string().optional(),
        }),
      )
      .optional(),
    hint: z.string().optional(),
    explanation: z.string().optional(),
  }),
  execute: async (input) => {
    let questionsList = input.questions || []
    if (questionsList.length === 0 && input.question && input.options) {
      questionsList = [
        {
          id: "q1",
          question: input.question,
          options: input.options,
          hint: input.hint,
          explanation: input.explanation || "",
        },
      ]
    }

    return {
      status: "created" as const,
      widgetType: "quiz" as const,
      topic: input.topic,
      title: input.title,
      questions: questionsList,
    }
  },
})

/**
 * 2. Flashcard Deck Tool
 * Generates an interactive flip-card deck for memorizing and drilling STEM formulas, theorems, and definitions.
 */
export const createFlashcardDeckTool = tool({
  description:
    "Generate an interactive deck of flashcards for memorizing and drilling STEM formulas, theorems, and definitions.",
  inputSchema: z.object({
    topic: z.string().describe("STEM topic title"),
    subject: z.string().describe("Broad subject/discipline, e.g. Mathematics, Physics, Computer Science, Chemistry"),
    cards: z
      .array(
        z.object({
          id: z.string().describe("Unique card identifier"),
          front: z.string().describe("Front of card: concept, formula name, or prompt with KaTeX math"),
          back: z.string().describe("Back of card: definition, formula, derivation, or explanation with KaTeX math"),
          conceptTag: z.string().optional().describe("Category tag or subtopic"),
        }),
      )
      .min(1)
      .max(10)
      .describe("Array of flashcards for drill practice"),
  }),
  execute: async (input) => {
    return {
      status: "created" as const,
      widgetType: "flashcard" as const,
      ...input,
    }
  },
})

/**
 * 3. Step-by-Step Math Problem Tool
 * Generates a structured multi-step calculation or proof problem with scaffolded guidance.
 */
export const createMathProblemTool = tool({
  description:
    "Generate a step-by-step guided math problem with sequential instruction steps, hints, and final answer validation.",
  inputSchema: z.object({
    topic: z.string().describe("Math topic"),
    subject: z.string().describe("Broad subject/discipline, e.g. Mathematics, Physics, Computer Science, Chemistry"),
    problemStatement: z.string().describe("Problem statement with KaTeX math"),
    steps: z
      .array(
        z.object({
          stepNumber: z.number().describe("1-based step sequence number"),
          instruction: z.string().describe("Guidance or sub-goal for this step"),
          hint: z.string().optional().describe("Calibrated hint for this step"),
        }),
      )
      .min(1)
      .max(8)
      .describe("Sequential solution steps"),
    finalAnswer: z.string().describe("Final simplified answer expression"),
    acceptedFormats: z.array(z.string()).optional().describe("Equivalent mathematical variations of the answer"),
    explanation: z.string().describe("Full step-by-step walkthrough"),
  }),
  execute: async (input) => {
    return {
      status: "created" as const,
      widgetType: "math_problem" as const,
      ...input,
    }
  },
})

/**
 * 4. True/False Quick Check Tool
 * Rapid binary check to diagnose common misconceptions and edge cases.
 */
export const createQuickCheckTool = tool({
  description: "Generate a quick True/False conceptual check to diagnose common misconceptions.",
  inputSchema: z.object({
    topic: z.string().describe("Concise topic the statement probes, e.g. Limits, Newton's Third Law"),
    subject: z.string().describe("Broad subject/discipline, e.g. Mathematics, Physics, Computer Science, Chemistry"),
    statement: z.string().describe("Concept assertion or equation with KaTeX math"),
    isTrue: z.boolean().describe("Whether the statement is True or False"),
    explanation: z.string().describe("Conceptual clarification explaining why it is True or False"),
  }),
  execute: async (input) => {
    return {
      status: "created" as const,
      widgetType: "quick_check" as const,
      ...input,
    }
  },
})

/**
 * 5. Update Learner Notes Tool
 * Autonomous qualitative memory recording pedagogical insights about the student.
 * Persisted into `learner_memory_notes` by the chat route (idempotent by toolCallId).
 */
export const updateLearnerNotesTool = tool({
  description:
    "Record an autonomous qualitative pedagogical observation or recommendation about the learner's understanding or cognitive patterns.",
  inputSchema: z.object({
    subject: z.string().describe("Broad subject/discipline, e.g. Mathematics, Physics, Computer Science, Chemistry"),
    topic: z.string().describe("STEM topic e.g. Polynomial Long Division, Trigonometry"),
    type: z
      .enum(["preference", "misconception", "strength", "goal", "observation"])
      .describe(
        "Category: 'strength' (a demonstrated skill), 'misconception' (a recurring error), 'preference' (how they learn best), 'goal' (their stated aim), or 'observation' (anything else)",
      ),
    observation: z
      .string()
      .describe("Qualitative insight, e.g. 'Struggles with distributing negative signs' or 'Prefers visual diagrams'"),
    recommendation: z.string().optional().describe("Pedagogical tip for future tutoring turns"),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("How confident you are in this observation, from 0 (guess) to 1 (certain)"),
  }),
  execute: async (input) => {
    return {
      status: "recorded" as const,
      ...input,
    }
  },
})

/**
 * Tutoring Tools collection for Shawky Socratic agent
 */
export const tutoringTools = {
  createQuiz: createQuizTool,
  createFlashcardDeck: createFlashcardDeckTool,
  createMathProblem: createMathProblemTool,
  createQuickCheck: createQuickCheckTool,
  updateLearnerNotes: updateLearnerNotesTool,
}
