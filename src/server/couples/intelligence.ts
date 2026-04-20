type IntelligenceInput = {
  partnerName: string;
  openReminderCount: number;
  weeklySelf: string[];
  weeklyPartner: string[];
  recentMessages: string[];
};

type ReminderSuggestion = {
  title: string;
  note: string;
  dueAt: string;
};

export type CoupleIntelligenceResult = {
  source: 'ai' | 'fallback';
  summary: string;
  highlights: string[];
  nextActions: string[];
  suggestions: ReminderSuggestion[];
};

function toIsoFromNow(daysAhead: number, hour = 19) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function ruleBasedSuggestions(messages: string[]): ReminderSuggestion[] {
  const text = messages.join(' ').toLowerCase();
  const suggestions: ReminderSuggestion[] = [];

  if (text.includes('birthday')) {
    suggestions.push({
      title: 'Plan birthday moment',
      note: 'Set a gift or celebration plan together.',
      dueAt: toIsoFromNow(5, 18),
    });
  }
  if (text.includes('anniversary')) {
    suggestions.push({
      title: 'Anniversary prep',
      note: 'Decide date idea and reserve time.',
      dueAt: toIsoFromNow(7, 18),
    });
  }
  if (text.includes('trip') || text.includes('travel')) {
    suggestions.push({
      title: 'Trip planning check-in',
      note: 'Lock dates, budget, and must-do list.',
      dueAt: toIsoFromNow(3, 20),
    });
  }
  if (text.includes('dinner') || text.includes('restaurant')) {
    suggestions.push({
      title: 'Book date dinner',
      note: 'Confirm place and time for your next dinner date.',
      dueAt: toIsoFromNow(2, 17),
    });
  }

  suggestions.push({
    title: 'Weekly couple check-in',
    note: 'Take 10 minutes to review what felt good this week.',
    dueAt: toIsoFromNow(2, 21),
  });

  return suggestions.slice(0, 4);
}

function fallbackIntelligence(input: IntelligenceInput): CoupleIntelligenceResult {
  const highlights: string[] = [];
  if (input.weeklySelf.length > 0 || input.weeklyPartner.length > 0) {
    highlights.push('You are both actively using weekly check-ins.');
  }
  if (input.openReminderCount > 0) {
    highlights.push(`You have ${input.openReminderCount} open shared reminder(s).`);
  } else {
    highlights.push('No open reminders right now, which is a good moment to plan ahead.');
  }
  if (input.recentMessages.length > 0) {
    highlights.push('Recent conversation activity is available for better planning signals.');
  }

  return {
    source: 'fallback',
    summary: `Your connection with ${input.partnerName} looks active. Keep momentum with one planned date and one weekly reflection.`,
    highlights: highlights.slice(0, 3),
    nextActions: [
      'Generate a date plan matching your current vibe and budget.',
      'Set one shared reminder for the next meaningful moment.',
      'Complete this week’s check-in together.',
    ],
    suggestions: ruleBasedSuggestions(input.recentMessages),
  };
}

function sanitizeResult(raw: unknown): Omit<CoupleIntelligenceResult, 'source'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.summary !== 'string') return null;

  const highlights = Array.isArray(obj.highlights)
    ? obj.highlights.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, 4)
    : [];
  const nextActions = Array.isArray(obj.nextActions)
    ? obj.nextActions.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, 4)
    : [];

  const suggestions = Array.isArray(obj.suggestions)
    ? obj.suggestions
        .map(item => {
          if (!item || typeof item !== 'object') return null;
          const suggestion = item as Record<string, unknown>;
          const title = typeof suggestion.title === 'string' ? suggestion.title.trim() : '';
          const note = typeof suggestion.note === 'string' ? suggestion.note.trim() : '';
          const dueAt = typeof suggestion.dueAt === 'string' ? suggestion.dueAt.trim() : '';
          if (!title || !dueAt) return null;
          const due = new Date(dueAt);
          if (Number.isNaN(due.getTime())) return null;
          return { title, note, dueAt: due.toISOString() };
        })
        .filter(Boolean)
        .slice(0, 4) as ReminderSuggestion[]
    : [];

  return {
    summary: obj.summary.trim().slice(0, 360),
    highlights: highlights.length ? highlights : ['Shared momentum is building through your current routines.'],
    nextActions: nextActions.length
      ? nextActions
      : ['Plan one quality date this week and keep check-ins consistent.'],
    suggestions,
  };
}

async function callOpenAI(apiKey: string, input: IntelligenceInput) {
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content:
            'You are a relationship product assistant. Return strict JSON only with keys: summary, highlights, nextActions, suggestions.',
        },
        {
          role: 'user',
          content: `Use this couple context and return strict JSON:
{
  "summary": "1-2 sentence relationship pulse",
  "highlights": ["max 4 concise bullets"],
  "nextActions": ["max 4 specific actions"],
  "suggestions": [{"title":"", "note":"", "dueAt":"ISO-8601"}]
}

Context:
- partnerName: ${input.partnerName}
- openReminderCount: ${input.openReminderCount}
- weeklySelf: ${JSON.stringify(input.weeklySelf)}
- weeklyPartner: ${JSON.stringify(input.weeklyPartner)}
- recentMessages: ${JSON.stringify(input.recentMessages)}

Rules:
- Keep warm and practical.
- No clinical language.
- Suggestions must be actionable reminders.
- dueAt values should be upcoming dates within 14 days.`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;
  return sanitizeResult(JSON.parse(content));
}

async function callAnthropic(apiKey: string, input: IntelligenceInput) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6',
    max_tokens: 480,
    messages: [
      {
        role: 'user',
        content: `Return strict JSON only:
{
  "summary": "1-2 sentence relationship pulse",
  "highlights": ["max 4 concise bullets"],
  "nextActions": ["max 4 specific actions"],
  "suggestions": [{"title":"", "note":"", "dueAt":"ISO-8601"}]
}

Context:
- partnerName: ${input.partnerName}
- openReminderCount: ${input.openReminderCount}
- weeklySelf: ${JSON.stringify(input.weeklySelf)}
- weeklyPartner: ${JSON.stringify(input.weeklyPartner)}
- recentMessages: ${JSON.stringify(input.recentMessages)}

Constraints:
- Warm, practical, non-judgmental.
- No explicit content.
- Reminder suggestions should be within 14 days.`,
      },
    ],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  return sanitizeResult(JSON.parse(text));
}

export async function generateCoupleIntelligence(input: IntelligenceInput): Promise<CoupleIntelligenceResult> {
  const openAIKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const fallback = fallbackIntelligence(input);

  if (!openAIKey && !anthropicKey) return fallback;

  try {
    const ai = openAIKey ? await callOpenAI(openAIKey, input) : await callAnthropic(anthropicKey as string, input);
    if (!ai) return fallback;
    return {
      source: 'ai',
      summary: ai.summary,
      highlights: ai.highlights,
      nextActions: ai.nextActions,
      suggestions: ai.suggestions.length ? ai.suggestions : fallback.suggestions,
    };
  } catch {
    return fallback;
  }
}
