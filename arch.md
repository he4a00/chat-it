# Chat-It Architecture & Product Specification

> **Status**: Living Document  
> **Last Updated**: 2026-10-10  
> **Rule**: Keep this file updated whenever architectural decisions, schemas, or product requirements evolve.

---

## 1. Vision & Core Concept

**Chat-It** is an intelligent, adaptive learning companion designed around a ChatGPT-like conversational workspace. The assistant serves as a personal tutor (defaulting to Mathematics, with support for other STEM and academic subjects) that utilizes **Generative UI** to turn educational challenges into native, interactive widgets directly within the chat stream.

The core differentiator is the tight closed-loop interaction between the learner, the interactive UI widgets (quizzes, flashcard decks, formula solvers), and the AI's evolving long-term memory of the learner's mastery, misconceptions, and goals.

---

## 2. Core User Experience & Layout

### 2.1 ChatGPT-Style Layout
- **Left Collapsible Sidebar**:
  - **New Chat** button with search & filter.
  - **Session History**: Chronologically grouped (`Today`, `Yesterday`, `Previous 7 Days`, `Earlier`).
  - **Learner Profile & Memory Drawer/Tab**: Dedicated view displaying:
    - Mastered topics vs. weak areas.
    - Historical accuracy and problem-solving streak.
    - Active AI memory notes (qualitative observations recorded by the tutor).
  - **Account & Settings**: Clerk user profile pill, theme switcher (light/dark), and preferences.
- **Main Chat Stage**:
  - **Header**: Active subject badge (e.g. `Mathematics: Algebra II`), topic header, clear/export actions, and memory inspector toggle.
  - **Chat Stream**:
    - User message bubbles.
    - Assistant message bubbles with full Markdown and **KaTeX** math rendering (inline `$..$` and block `$$..$$`).
    - Embedded interactive Generative UI widgets.
  - **Prompt Composer**:
    - Expanding autosize textarea.
    - **Math Quick-Symbol Bar**: Fast insertion toolbar for LaTeX symbols (fractions `\frac`, exponents, square roots `\sqrt`, integrals, Greek letters).
    - **Quick Action Pills**: One-click prompt starters (*"Quiz me on this"*, *"Make flashcards"*, *"Give me a practice problem"*, *"Quick check"*).

---

## 3. Onboarding Flow

- **First-Time User Modal**: Triggered on first authentication (or when a profile has no active curriculum).
  1. **Subject Selection**: Pre-selected default is **Mathematics**, with options for Physics, Computer Science, Chemistry, Biology, etc.
  2. **Skill / Grade Level**: E.g., Middle School, High School (Algebra/Geometry), AP Calculus, University Linear Algebra.
  3. **Learning Goal & Pace**: Concept foundation, exam preparation, homework help, or casual curiosity.
- **Outcome**: Persists the initial `learner_profiles` record in the database and seeds the first interactive chat session with a tailored opening prompt.

---

## 4. Generative UI Interactive Widgets

The tutor generates typed UI widgets within the chat message stream using LLM tool calling. Each widget is a first-class React component:

| Widget | Purpose | Interactions |
| :--- | :--- | :--- |
| **Multiple-Choice Quiz** (`createQuiz`) | Rapid concept validation & exam prep | Selectable options, instant visual feedback (correct/incorrect highlights), hint reveal, worked explanation. |
| **Flashcard Deck** (`createFlashcardDeck`) | Spaced repetition & memorization | 3D card flip animation, next/previous navigation, self-assessment confidence ratings (*"Know it"* / *"Review again"*). |
| **Step-by-Step Math Problem** (`createMathProblem`) | Deep procedural math problem-solving | Input field for numeric or LaTeX formula answers, progressive step hints, validation button, solution walkthrough. |
| **True/False Quick Check** (`createQuickCheck`) | Fast misconception checks | Binary option card with instant verification and explanation. |

### 4.1 Hybrid Feedback Loop
1. **Local Instant Visual Reaction**: When the user clicks an option or submits an answer, the widget immediately renders visual feedback (green/red borders, card flips, score animations).
2. **Context Notification to Agent**: The widget triggers an automated client-to-agent event delivering the user's choice, correctness, and time spent.
3. **Adaptive Pedagogical Follow-up**: The AI tutor immediately responds with encouragement, clarification on misconceptions, or advances to the next step.
4. **State Persistence**: Completed answers and scores are permanently stored in the PostgreSQL database so re-opening older chats restores the exact completed widget state.

---

## 5. Memory & Context Architecture

The assistant maintains continuous understanding across sessions using a dual-memory approach:

```
┌────────────────────────────────────────────────────────┐
│                   Dual Memory System                   │
├───────────────────────────┬────────────────────────────┤
│   Deterministic Engine    │    Autonomous AI Notes     │
├───────────────────────────┼────────────────────────────┤
│ • Widget scores & metrics │ • Qualitative observations │
│ • Topic accuracy %        │ • Identified misconceptions│
│ • Completion timestamps   │ • Preferred analogies      │
│ • Problem attempt counts  │ • Tool: updateLearnerNotes │
└───────────────────────────┴────────────────────────────┘
                            │
                            ▼
          Injected into System Prompt Context
```

### 5.1 Tracked Dimensions
1. **Learner Profile**: Subject, level, pace, learning goals.
2. **Mastery Matrix**: Accuracy rate per topic, difficulty progression, problem attempts.
3. **Qualitative Memory Notes**: Bulleted memory items managed via `updateLearnerNotes` tool (e.g. *"Struggles with negative exponents; responds well to geometric illustrations"*).
4. **Session History**: Complete message log with tool results and widget snapshots.

### 5.2 Persona & Teaching Style
- **Socratic & Encouraging**: The tutor guides step-by-step through leading questions and hints. It avoids dumping complete answers immediately, validating good attempts and breaking down complex problems into manageable steps.

---

## 6. Technical Architecture & Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Design System & Theme**:
  - **Theme**: VTRON (`tweakcn.com/themes/cmjhgwebp000404jl22fv5sh6`)
  - **Primary Palette**: Crisp paper light background (`oklch(0.99 0 0)`), deep midnight navy text/foreground (`oklch(0.199 0.047 270.6)`), vibrant cobalt/royal blue primary (`oklch(0.573 0.234 264.4)`).
  - **Dark Mode**: Pure obsidian background (`oklch(0 0 0)`), high-contrast cards (`oklch(0.168 0 0)`), vivid primary blue accents.
  - **Typography**: IBM Plex Sans (self-hosted variable WOFF2 via `next/font/local`, bound to `--font-sans`).
  - **UI Primitives**: shadcn/ui with Base UI primitives (`@base-ui/react`, `components/ui/`).
- **AI Engine**: Vercel AI SDK (`ai`) with Google Gemini (`@ai-sdk/google`, Gemini 2.0 Flash) configured via `GEMINI_API_KEY`.
- **Database & ORM**: PostgreSQL (Neon / Supabase cloud connection via `DATABASE_URL`) with **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`).
- **Authentication**: **Clerk** (`@clerk/nextjs`) with graceful fallback to a persistent Demo User in local development if Clerk keys are absent.
- **Math Engine**: KaTeX (`katex`, `rehype-katex`, `remark-math`).

---

## 7. Database Schema Blueprint (Drizzle ORM)

```
users (or clerk_users)
├── id: text (PK)
├── email: text
├── name: text
└── created_at: timestamp

learner_profiles
├── id: uuid (PK)
├── user_id: text (FK -> users.id)
├── subject: text (default: 'Mathematics')
├── skill_level: text ('beginner' | 'intermediate' | 'advanced')
├── learning_goal: text
├── preferences: jsonb
└── updated_at: timestamp

chats
├── id: uuid (PK)
├── user_id: text (FK -> users.id)
├── title: text
├── subject: text
└── updated_at: timestamp

messages
├── id: uuid (PK)
├── chat_id: uuid (FK -> chats.id)
├── role: text ('user' | 'assistant' | 'system' | 'tool')
├── content: text
├── tool_invocations: jsonb
└── created_at: timestamp

widget_states
├── id: uuid (PK)
├── message_id: uuid (FK -> messages.id)
├── widget_type: text ('quiz' | 'flashcard' | 'math_problem' | 'quick_check')
├── payload: jsonb (questions, cards, steps)
├── user_submission: jsonb (selected option, answer, rating)
├── is_completed: boolean
├── score: integer
└── submitted_at: timestamp

learner_memory_notes
├── id: uuid (PK)
├── user_id: text (FK -> users.id)
├── topic: text
├── note: text
├── confidence: real
└── created_at: timestamp

topic_mastery
├── id: uuid (PK)
├── user_id: text (FK -> users.id)
├── topic: text
├── mastery_score: real (0.0 to 1.0)
├── total_problems: integer
├── correct_problems: integer
└── last_practiced_at: timestamp
```

---

## 8. Agent Tool Contracts

### `createQuiz`
```ts
{
  topic: string;
  question: string;
  options: { id: string; label: string; isCorrect: boolean }[];
  hint?: string;
  explanation: string;
}
```

### `createFlashcardDeck`
```ts
{
  topic: string;
  cards: { id: string; front: string; back: string; category?: string }[];
}
```

### `createMathProblem`
```ts
{
  topic: string;
  problemStatement: string;
  steps: { stepNumber: number; instruction: string; hint?: string }[];
  finalAnswer: string;
  acceptedFormats?: string[];
  explanation: string;
}
```

### `createQuickCheck`
```ts
{
  statement: string;
  isTrue: boolean;
  explanation: string;
}
```

### `updateLearnerNotes`
```ts
{
  topic: string;
  observation: string; // e.g. "Struggles with factoring quadratic equations when leading coefficient > 1"
  recommendation?: string;
}
```
