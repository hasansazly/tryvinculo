'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function StartConversationButton({ matchUserId }: { matchUserId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onStart = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/messages/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchUserId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Unable to start conversation');
      }

      if (!data.conversationId || typeof data.conversationId !== 'string') {
        throw new Error('Conversation id not returned');
      }

      router.push(`/messages/${data.conversationId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start conversation';
      setError(message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onStart}
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/25 px-4 py-3 text-sm font-semibold text-violet-100 hover:from-violet-500/45 hover:to-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <MessageCircle size={16} />
        {isLoading ? 'Opening chat...' : 'Message This Match'}
      </button>
      {error ? <p className="mt-2 text-center text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
