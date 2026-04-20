type PlannerInput = {
  vibe: string;
  budget: string;
  duration: string;
  locationHint: string;
};

type PlannerTemplate = {
  key: string;
  title: string;
  summary: string;
  steps: string[];
};

const VIBE_TEMPLATES: Record<string, PlannerTemplate> = {
  cozy: {
    key: 'cozy',
    title: 'Cozy Slow Evening',
    summary: 'Low-pressure quality time with meaningful conversation and calm energy.',
    steps: ['Pick a quiet cafe or tea spot.', 'Take a short walk and ask one deep question each.', 'End with a shared dessert and recap your favorite moment.'],
  },
  playful: {
    key: 'playful',
    title: 'Playful Adventure Date',
    summary: 'A light, laugh-heavy date with movement and discovery.',
    steps: ['Start with a mini challenge game or arcade round.', 'Switch to a spontaneous activity nearby.', 'Capture one photo memory and choose a next-date idea together.'],
  },
  romantic: {
    key: 'romantic',
    title: 'Romantic Signature Night',
    summary: 'Intentional atmosphere, elevated details, and emotional closeness.',
    steps: ['Choose a spot with warm ambiance and lower noise.', 'Share appreciation prompts during the date.', 'Finish with a surprise gesture or note.'],
  },
  creative: {
    key: 'creative',
    title: 'Creative Connection Date',
    summary: 'Build something together and create a memory you can keep.',
    steps: ['Try a class or at-home creation activity.', 'Share playlists or inspiration while creating.', 'Save the final result in your memory timeline.'],
  },
};

function normalizeVibe(value: string) {
  const key = value.trim().toLowerCase();
  if (key in VIBE_TEMPLATES) return key as keyof typeof VIBE_TEMPLATES;
  return 'cozy';
}

function budgetNudge(budget: string) {
  const normalized = budget.trim();
  if (normalized === '$') return 'Keep it simple: use one paid stop and one free moment.';
  if (normalized === '$$$') return 'Add one premium touch: elevated dining, tickets, or a surprise gift.';
  return 'Balance comfort and novelty for a date that feels thoughtful, not forced.';
}

export function generateDatePlan(input: PlannerInput) {
  const vibeKey = normalizeVibe(input.vibe);
  const template = VIBE_TEMPLATES[vibeKey];
  const locationPhrase = input.locationHint.trim()
    ? `in ${input.locationHint.trim()}`
    : 'near you';
  const durationPhrase = input.duration.trim() || '2-3h';
  const budgetPhrase = input.budget.trim() || '$$';
  const nudge = budgetNudge(budgetPhrase);

  return {
    title: `${template.title} (${durationPhrase})`,
    summary: `${template.summary} Planned ${locationPhrase} with a ${budgetPhrase} budget. ${nudge}`,
    steps: template.steps,
  };
}
