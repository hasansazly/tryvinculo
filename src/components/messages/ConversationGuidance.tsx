'use client';

import { Lightbulb } from 'lucide-react';
import { CONVERSATION_BUTTON_COPY, CONVERSATION_PROMPTS } from '@/lib/conversationSupportCopy';

type GuidanceKind = 'startEasy' | 'goDeeper' | 'suggestPlan';

function withContext(prompt: string, context: { reason?: string; intent?: string }) {
  if (prompt.includes('[interest]') && context.reason) {
    return prompt.replace('[interest]', context.reason);
  }

  if (!context.intent) return prompt;

  if (prompt.toLowerCase().includes('what are you looking for')) {
    return `${prompt} I noticed your intent says ${context.intent}.`;
  }

  return prompt;
}

export default function ConversationGuidance({
  onPick,
  compatibilityReasons,
  relationshipIntent,
}: {
  onPick: (message: string) => void;
  compatibilityReasons: string[];
  relationshipIntent?: string;
}) {
  const primaryReason = compatibilityReasons[0] ?? 'shared priorities';

  const groups: Record<GuidanceKind, string[]> = {
    startEasy: CONVERSATION_PROMPTS.opening.thoughtful.slice(0, 3),
    goDeeper: CONVERSATION_PROMPTS.substance.direct.slice(0, 3),
    suggestPlan: CONVERSATION_PROMPTS.plan.playful.slice(0, 3),
  };

  const categoryTitles: Record<GuidanceKind, string> = {
    startEasy: CONVERSATION_BUTTON_COPY.startEasy.label,
    goDeeper: CONVERSATION_BUTTON_COPY.goDeeper.label,
    suggestPlan: CONVERSATION_BUTTON_COPY.suggestPlan.label,
  };

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-200/90">
        <Lightbulb size={14} />
        Conversation guidance
      </div>
      <div className="space-y-2">
        {(Object.keys(groups) as GuidanceKind[]).map(kind => (
          <div key={kind} className="rounded-xl border border-slate-700/70 bg-slate-800/55 p-2.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">{categoryTitles[kind]}</p>
            <div className="flex flex-wrap gap-2">
              {groups[kind].map(prompt => {
                const text = withContext(prompt, {
                  reason: primaryReason,
                  intent: relationshipIntent,
                });
                return (
                  <button
                    key={`${kind}-${prompt}`}
                    type="button"
                    onClick={() => onPick(text)}
                    className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100 hover:bg-violet-500/20"
                    title="Insert into message"
                  >
                    {text.length > 56 ? `${text.slice(0, 56)}...` : text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
