/**
 * Config-driven onboarding.
 *
 * Adding a step is a matter of appending one object here — the wizard renders
 * whatever it finds, and every answer is recorded verbatim into
 * `learner_profiles.onboarding_answers` (plus known keys mapped to typed columns).
 *
 * Display copy lives in the `onboarding` namespace (see public/locales); each field
 * holds a translation KEY, while `value` is the stable string that gets persisted.
 */

export type OnboardingStepKind = "single" | "text"

export type OnboardingStepIcon = "compass" | "gauge" | "target"

export interface OnboardingChoice {
  /** The persisted answer value — never translated. */
  value: string
  labelKey: string
  descriptionKey?: string
}

export interface OnboardingStep {
  /** Storage key (also the `onboarding_answers` key). */
  id: string
  kind: OnboardingStepKind
  icon: OnboardingStepIcon
  /** Shawky's spoken line for this step. */
  talkKey: string
  titleKey: string
  descriptionKey?: string
  choices?: OnboardingChoice[]
  /** Show an optional "type your own" input alongside the choices. */
  allowCustom?: boolean
  customLabelKey?: string
  customPlaceholderKey?: string
  optional?: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "subject",
    kind: "single",
    icon: "compass",
    talkKey: "steps.subject.talk",
    titleKey: "steps.subject.title",
    descriptionKey: "steps.subject.description",
    allowCustom: true,
    customLabelKey: "steps.subject.customLabel",
    customPlaceholderKey: "steps.subject.customPlaceholder",
    choices: [
      { value: "Mathematics", labelKey: "steps.subject.choices.mathematics" },
      { value: "Physics", labelKey: "steps.subject.choices.physics" },
      { value: "Chemistry", labelKey: "steps.subject.choices.chemistry" },
      { value: "Biology", labelKey: "steps.subject.choices.biology" },
      { value: "Computer Science", labelKey: "steps.subject.choices.computerScience" },
      { value: "English", labelKey: "steps.subject.choices.english" },
    ],
  },
  {
    id: "skillLevel",
    kind: "single",
    icon: "gauge",
    talkKey: "steps.skillLevel.talk",
    titleKey: "steps.skillLevel.title",
    descriptionKey: "steps.skillLevel.description",
    choices: [
      {
        value: "beginner",
        labelKey: "steps.skillLevel.choices.beginner.label",
        descriptionKey: "steps.skillLevel.choices.beginner.description",
      },
      {
        value: "intermediate",
        labelKey: "steps.skillLevel.choices.intermediate.label",
        descriptionKey: "steps.skillLevel.choices.intermediate.description",
      },
      {
        value: "advanced",
        labelKey: "steps.skillLevel.choices.advanced.label",
        descriptionKey: "steps.skillLevel.choices.advanced.description",
      },
    ],
  },
  {
    id: "learningGoal",
    kind: "single",
    icon: "target",
    talkKey: "steps.learningGoal.talk",
    titleKey: "steps.learningGoal.title",
    descriptionKey: "steps.learningGoal.description",
    optional: true,
    allowCustom: true,
    customLabelKey: "steps.learningGoal.customLabel",
    customPlaceholderKey: "steps.learningGoal.customPlaceholder",
    choices: [
      { value: "Exam preparation", labelKey: "steps.learningGoal.choices.examPreparation" },
      { value: "Master a specific topic", labelKey: "steps.learningGoal.choices.masterTopic" },
      { value: "Build a daily practice habit", labelKey: "steps.learningGoal.choices.dailyPractice" },
      { value: "Explore and stay curious", labelKey: "steps.learningGoal.choices.explore" },
    ],
  },
]
