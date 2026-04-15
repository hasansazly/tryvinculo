export type OnboardingCategory =
  | 'relationship intent'
  | 'communication style'
  | 'pace and consistency'
  | 'lifestyle and values'
  | 'emotional compatibility';

export type OnboardingAnswerFormat = 'multiple choice' | 'slider' | 'tags' | 'single select';

export interface OnboardingQuestionSpec {
  id: string;
  category: OnboardingCategory;
  question: string;
  answerFormat: OnboardingAnswerFormat;
  predictiveWhy: string;
}

export const ONBOARDING_QUESTION_SET: OnboardingQuestionSpec[] = [
  // Relationship intent
  {
    id: 'ri_1',
    category: 'relationship intent',
    question: 'What are you hoping this leads to?',
    answerFormat: 'single select',
    predictiveWhy: 'Intent alignment reduces mismatched expectations early.',
  },
  {
    id: 'ri_2',
    category: 'relationship intent',
    question: 'How important is long-term potential to you right now?',
    answerFormat: 'slider',
    predictiveWhy: 'Captures seriousness level without forcing binary labels.',
  },
  {
    id: 'ri_3',
    category: 'relationship intent',
    question: 'What does a great first month of dating look like to you?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Reveals expected pace and style of early connection.',
  },
  {
    id: 'ri_4',
    category: 'relationship intent',
    question: 'How soon do you want exclusivity, if things feel right?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Compares exclusivity timeline expectations.',
  },
  {
    id: 'ri_5',
    category: 'relationship intent',
    question: 'Which matters more right now: chemistry, clarity, or both equally?',
    answerFormat: 'single select',
    predictiveWhy: 'Surfaces decision style and relationship priorities.',
  },

  // Communication style
  {
    id: 'cs_1',
    category: 'communication style',
    question: 'How do you like to communicate between dates?',
    answerFormat: 'single select',
    predictiveWhy: 'Matches cadence preferences to avoid communication friction.',
  },
  {
    id: 'cs_2',
    category: 'communication style',
    question: 'When conflict comes up, what feels most respectful?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Signals repair style and emotional safety expectations.',
  },
  {
    id: 'cs_3',
    category: 'communication style',
    question: 'How direct are you when something feels off?',
    answerFormat: 'slider',
    predictiveWhy: 'Measures clarity preference and tolerance for ambiguity.',
  },
  {
    id: 'cs_4',
    category: 'communication style',
    question: 'What kind of first message gets your attention?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Improves conversation starters and response compatibility.',
  },
  {
    id: 'cs_5',
    category: 'communication style',
    question: 'Pick 3 words that describe your conversation style.',
    answerFormat: 'tags',
    predictiveWhy: 'Creates expressive style vectors for matching.',
  },

  // Pace and consistency
  {
    id: 'pc_1',
    category: 'pace and consistency',
    question: 'How many times a week do you ideally want to connect?',
    answerFormat: 'single select',
    predictiveWhy: 'Aligns availability and momentum expectations.',
  },
  {
    id: 'pc_2',
    category: 'pace and consistency',
    question: 'How quickly do you usually reply when you are interested?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Sets realistic expectations around responsiveness.',
  },
  {
    id: 'pc_3',
    category: 'pace and consistency',
    question: 'How soon do you prefer meeting in person?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Balances digital vs in-person pacing compatibility.',
  },
  {
    id: 'pc_4',
    category: 'pace and consistency',
    question: 'Do you prefer planned dates or spontaneous plans?',
    answerFormat: 'single select',
    predictiveWhy: 'Captures scheduling style compatibility.',
  },
  {
    id: 'pc_5',
    category: 'pace and consistency',
    question: 'How important is consistency to you while dating?',
    answerFormat: 'slider',
    predictiveWhy: 'Predicts satisfaction with communication follow-through.',
  },

  // Lifestyle and values
  {
    id: 'lv_1',
    category: 'lifestyle and values',
    question: 'Which life priorities matter most in this season?',
    answerFormat: 'tags',
    predictiveWhy: 'Priorities alignment strongly predicts long-term fit.',
  },
  {
    id: 'lv_2',
    category: 'lifestyle and values',
    question: 'What does your ideal weekend usually look like?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Lifestyle rhythm fit supports practical compatibility.',
  },
  {
    id: 'lv_3',
    category: 'lifestyle and values',
    question: 'How social is your normal week?',
    answerFormat: 'slider',
    predictiveWhy: 'Maps social energy and recharge needs.',
  },
  {
    id: 'lv_4',
    category: 'lifestyle and values',
    question: 'How important is career ambition in a partner?',
    answerFormat: 'slider',
    predictiveWhy: 'Detects ambition/value alignment and future tension points.',
  },
  {
    id: 'lv_5',
    category: 'lifestyle and values',
    question: 'Which future goals matter most to you?',
    answerFormat: 'tags',
    predictiveWhy: 'Future-goal overlap is a strong filter for serious dating.',
  },

  // Emotional compatibility
  {
    id: 'ec_1',
    category: 'emotional compatibility',
    question: 'What helps you feel safe opening up?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Reveals emotional safety needs and trust builders.',
  },
  {
    id: 'ec_2',
    category: 'emotional compatibility',
    question: 'How quickly do you usually open up when dating?',
    answerFormat: 'slider',
    predictiveWhy: 'Aligns emotional pace to reduce pressure mismatch.',
  },
  {
    id: 'ec_3',
    category: 'emotional compatibility',
    question: 'When stressed, what support feels best?',
    answerFormat: 'single select',
    predictiveWhy: 'Maps support preferences for day-to-day compatibility.',
  },
  {
    id: 'ec_4',
    category: 'emotional compatibility',
    question: 'How do you usually show care in a relationship?',
    answerFormat: 'multiple choice',
    predictiveWhy: 'Compares expression-of-care styles with partner needs.',
  },
  {
    id: 'ec_5',
    category: 'emotional compatibility',
    question: 'How important is emotional steadiness in a partner?',
    answerFormat: 'slider',
    predictiveWhy: 'Captures tolerance for volatility vs steadiness.',
  },
];

export const ONBOARDING_QUESTIONS_TO_AVOID: string[] = [
  'What is your zodiac sign and moon sign?',
  'What is your MBTI type?',
  'Do people usually fall in love with you quickly?',
  'How many dates can you juggle at once?',
  'Would your ex call you difficult?',
  'What trauma shaped your relationships?',
  'How often do you get jealous?',
  'Can you promise not to ghost?',
  'How attractive do you think you are?',
  'How fast should someone prove they want you?',
];

export const ONBOARDING_MICROCOPY_TIPS: string[] = [
  'Use progress reassurance: "Short step, then you are done."',
  'Frame each prompt with user benefit: "This helps us reduce guesswork."',
  'Use plain labels over internal terms: "How you communicate" instead of technical wording.',
  'Add low-pressure language: "Pick what is closest."',
  'Keep helper text brief and calm: one line max per question.',
];

export const ONBOARDING_CATEGORY_COUNT: Record<OnboardingCategory, number> = ONBOARDING_QUESTION_SET.reduce(
  (acc, q) => {
    acc[q.category] = (acc[q.category] ?? 0) + 1;
    return acc;
  },
  {
    'relationship intent': 0,
    'communication style': 0,
    'pace and consistency': 0,
    'lifestyle and values': 0,
    'emotional compatibility': 0,
  } as Record<OnboardingCategory, number>
);
