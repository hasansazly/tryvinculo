type PlannerInput = {
  vibe: string;
  budget: string;
  duration: string;
  locationHint: string;
};

type PlanResult = {
  title: string;
  summary: string;
  steps: string[];
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

export function generateDatePlan(input: PlannerInput): PlanResult {
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

function parsePlanJson(raw: string): PlanResult | null {
  try {
    const parsed = JSON.parse(raw) as {
      title?: unknown;
      summary?: unknown;
      steps?: unknown;
    };
    if (typeof parsed.title !== 'string' || typeof parsed.summary !== 'string' || !Array.isArray(parsed.steps)) {
      return null;
    }
    const steps = parsed.steps
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 5) as string[];
    if (!steps.length) return null;
    return {
      title: parsed.title.trim().slice(0, 120),
      summary: parsed.summary.trim().slice(0, 360),
      steps,
    };
  } catch {
    return null;
  }
}

async function callOpenAI(apiKey: string, input: PlannerInput): Promise<PlanResult | null> {
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a premium dating planner. Return strict JSON only: {"title":"...","summary":"...","steps":["..."]}. Keep steps practical and safe.',
        },
        {
          role: 'user',
          content: `Create one date plan with this context:
- vibe: ${input.vibe}
- budget: ${input.budget}
- duration: ${input.duration}
- location hint: ${input.locationHint || 'not provided'}

Rules:
- Focus on emotional connection and practical logistics.
- No explicit content.
- 3 to 5 steps max.
- Mention budget fit in summary.
- Return strict JSON only.`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  return parsePlanJson(text);
}

async function callAnthropic(apiKey: string, input: PlannerInput): Promise<PlanResult | null> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6',
    max_tokens: 360,
    messages: [
      {
        role: 'user',
        content: `Create one premium date plan.
Context:
- vibe: ${input.vibe}
- budget: ${input.budget}
- duration: ${input.duration}
- location hint: ${input.locationHint || 'not provided'}

Return strict JSON only:
{"title":"...","summary":"...","steps":["step1","step2","step3"]}`,
      },
    ],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  return parsePlanJson(text);
}

export async function generateDatePlanWithAI(input: PlannerInput): Promise<{ plan: PlanResult; source: 'ai' | 'fallback' }> {
  const openAIKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openAIKey && !anthropicKey) {
    return { plan: generateDatePlan(input), source: 'fallback' };
  }

  try {
    let aiPlan: PlanResult | null = null;
    if (openAIKey) {
      aiPlan = await callOpenAI(openAIKey, input);
    } else if (anthropicKey) {
      aiPlan = await callAnthropic(anthropicKey, input);
    }

    if (aiPlan) {
      return { plan: aiPlan, source: 'ai' };
    }
  } catch {
    // fall through to deterministic fallback
  }

  return { plan: generateDatePlan(input), source: 'fallback' };
}
