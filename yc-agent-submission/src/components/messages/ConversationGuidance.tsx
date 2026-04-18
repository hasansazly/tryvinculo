'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
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
  conversationId,
  compatibilityReasons,
  relationshipIntent,
}: {
  onPick: (message: string) => void;
  conversationId: string;
  compatibilityReasons: string[];
  relationshipIntent?: string;
}) {
  const primaryReason = compatibilityReasons[0] ?? 'shared priorities';

  const fallbackGroups = useMemo(
    () => ({
      startEasy: CONVERSATION_PROMPTS.opening.thoughtful.slice(0, 3),
      goDeeper: CONVERSATION_PROMPTS.substance.direct.slice(0, 3),
      suggestPlan: CONVERSATION_PROMPTS.plan.playful.slice(0, 3),
    }),
    []
  );
  const [groups, setGroups] = useState<Record<GuidanceKind, string[]>>(fallbackGroups);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/messages/spark-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            compatibilityReasons,
            relationshipIntent,
          }),
        });

        if (!res.ok) throw new Error('Failed to load AI suggestions');
        const json = (await res.json()) as {
          source?: 'ai' | 'fallback';
          suggestions?: Partial<Record<GuidanceKind, string[]>>;
        };

        const nextGroups: Record<GuidanceKind, string[]> = {
          startEasy: (json.suggestions?.startEasy ?? fallbackGroups.startEasy).slice(0, 3),
          goDeeper: (json.suggestions?.goDeeper ?? fallbackGroups.goDeeper).slice(0, 3),
          suggestPlan: (json.suggestions?.suggestPlan ?? fallbackGroups.suggestPlan).slice(0, 3),
        };

        if (active) {
          setGroups(nextGroups);
          setSource(json.source === 'ai' ? 'ai' : 'fallback');
        }
      } catch {
        if (active) {
          setGroups(fallbackGroups);
          setSource('fallback');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [conversationId, compatibilityReasons, relationshipIntent, fallbackGroups]);

  const categoryTitles: Record<GuidanceKind, string> = {
    startEasy: CONVERSATION_BUTTON_COPY.startEasy.label,
    goDeeper: CONVERSATION_BUTTON_COPY.goDeeper.label,
    suggestPlan: CONVERSATION_BUTTON_COPY.suggestPlan.label,
  };

  return (
    <section className="rounded-xl border border-white/15 bg-[#0F142E] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.06em] text-white/50">
        <Flame size={14} />
        Spark prompts
      </div>
      <p className="mb-2 text-xs text-white/60">
        {loading
          ? 'Generating context-aware suggestions...'
          : source === 'ai'
            ? 'AI suggestions are based on your recent conversation.'
            : 'Using local prompt fallback. Add an API key for AI-generated suggestions.'}
      </p>
      <div className="space-y-2">
        {(Object.keys(groups) as GuidanceKind[]).map(kind => (
          <div key={kind} className="rounded-xl border border-white/15 bg-[#121938] p-2.5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-white/40">{categoryTitles[kind]}</p>
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
                    className="rounded-[20px] border border-white/15 bg-[#1E1E35] px-3 py-1.5 text-xs text-white/80 hover:border-[#6C62E8] hover:bg-[#252540]"
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
