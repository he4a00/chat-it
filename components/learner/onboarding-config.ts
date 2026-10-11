/**
 * Config-driven onboarding.
 *
 * Adding a step is a matter of appending one object here — the wizard renders
 * whatever it finds, and every answer is recorded verbatim into
 * `learner_profiles.onboarding_answers` (plus known keys mapped to typed columns).
 *
 * `talkEn` / `talkAr` are Shawky's spoken lines (rendered in his speech bubble);
 * `titleEn` / `titleAr` are the crisp heading on the task panel.
 */

export type OnboardingStepKind = "single" | "text"

export type OnboardingStepIcon = "compass" | "gauge" | "target"

export interface OnboardingChoice {
  value: string
  labelEn: string
  labelAr: string
  descriptionEn?: string
  descriptionAr?: string
}

export interface OnboardingStep {
  /** Storage key (also the `onboarding_answers` key). */
  id: string
  kind: OnboardingStepKind
  icon: OnboardingStepIcon
  /** Shawky's spoken line for this step. */
  talkEn: string
  talkAr: string
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  choices?: OnboardingChoice[]
  /** Show an optional "type your own" input alongside the choices. */
  allowCustom?: boolean
  customLabelEn?: string
  customLabelAr?: string
  customPlaceholderEn?: string
  customPlaceholderAr?: string
  optional?: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "subject",
    kind: "single",
    icon: "compass",
    talkEn: "Hi, I'm Shawky, your tutor. What would you like to explore first?",
    talkAr: "أهلاً، أنا شوقي مدرّسك. ما الذي تودّ استكشافه أولاً؟",
    titleEn: "Choose a subject",
    titleAr: "اختر المادة",
    descriptionEn: "Pick a starting point. You can ask me about anything, anytime.",
    descriptionAr: "اختر نقطة بداية، ويمكنك سؤالي عن أي شيء في أي وقت.",
    allowCustom: true,
    customLabelEn: "Or type your own subject",
    customLabelAr: "أو اكتب المادة بنفسك",
    customPlaceholderEn: "e.g. Economics, History, Music theory…",
    customPlaceholderAr: "مثال: الاقتصاد، التاريخ، نظرية الموسيقى…",
    choices: [
      { value: "Mathematics", labelEn: "Mathematics", labelAr: "الرياضيات" },
      { value: "Physics", labelEn: "Physics", labelAr: "الفيزياء" },
      { value: "Chemistry", labelEn: "Chemistry", labelAr: "الكيمياء" },
      { value: "Biology", labelEn: "Biology", labelAr: "الأحياء" },
      { value: "Computer Science", labelEn: "Computer Science", labelAr: "علوم الحاسب" },
      { value: "English", labelEn: "English", labelAr: "اللغة الإنجليزية" },
    ],
  },
  {
    id: "skillLevel",
    kind: "single",
    icon: "gauge",
    talkEn: "Nice choice. How much experience do you have here?",
    talkAr: "اختيار جيد. ما مقدار خبرتك في هذا المجال؟",
    titleEn: "Set your level",
    titleAr: "حدّد مستواك",
    descriptionEn: "I'll match how much I explain to it.",
    descriptionAr: "سأضبط مقدار الشرح وفقاً لمستواك.",
    choices: [
      {
        value: "beginner",
        labelEn: "Just starting out",
        labelAr: "مبتدئ",
        descriptionEn: "New to the subject",
        descriptionAr: "جديد في المادة",
      },
      {
        value: "intermediate",
        labelEn: "Getting comfortable",
        labelAr: "متوسط",
        descriptionEn: "I know the basics",
        descriptionAr: "أعرف الأساسيات",
      },
      {
        value: "advanced",
        labelEn: "Confident",
        labelAr: "متقدّم",
        descriptionEn: "Ready for hard problems",
        descriptionAr: "جاهز للمسائل الصعبة",
      },
    ],
  },
  {
    id: "learningGoal",
    kind: "single",
    icon: "target",
    talkEn: "Last one. What are you working toward?",
    talkAr: "آخر خطوة. ما الذي تسعى إليه؟",
    titleEn: "Your goal",
    titleAr: "هدفك",
    descriptionEn: "Optional, but it helps me keep you on track.",
    descriptionAr: "اختياري، لكنه يساعدني على إبقائك على المسار.",
    optional: true,
    allowCustom: true,
    customLabelEn: "Or describe your own goal",
    customLabelAr: "أو صِف هدفك بنفسك",
    customPlaceholderEn: "e.g. Get ready for finals in three weeks",
    customPlaceholderAr: "مثال: الاستعداد للامتحانات خلال ثلاثة أسابيع",
    choices: [
      {
        value: "Exam preparation",
        labelEn: "Exam preparation",
        labelAr: "الاستعداد للامتحانات",
      },
      {
        value: "Master a specific topic",
        labelEn: "Master a topic",
        labelAr: "إتقان موضوع معيّن",
      },
      {
        value: "Build a daily practice habit",
        labelEn: "Daily practice",
        labelAr: "ممارسة يومية",
      },
      {
        value: "Explore and stay curious",
        labelEn: "Explore freely",
        labelAr: "استكشاف بحرّية",
      },
    ],
  },
]
