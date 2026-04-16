'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, UserX } from 'lucide-react';

type ActionKind = 'report' | 'block' | 'unmatch';

export default function ConnectionSafetyActions({
  targetUserId,
  compact = false,
  onActionComplete,
}: {
  targetUserId: string;
  compact?: boolean;
  onActionComplete?: (kind: ActionKind) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ActionKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (kind: ActionKind) => {
    if (loading) return;
    setError(null);

    if (kind === 'block') {
      const ok = window.confirm('Block this user? This will hide matches and disable messaging both ways.');
      if (!ok) return;
    }

    if (kind === 'unmatch') {
      const ok = window.confirm('Unmatch this user? This will close this connection and disable messaging.');
      if (!ok) return;
    }

    const reason =
      kind === 'report'
        ? window.prompt('Reason for report (required):', 'inappropriate behavior')?.trim() ?? ''
        : kind;

    if (kind === 'report' && !reason) {
      setError('Report reason is required.');
      return;
    }

    setLoading(kind);

    try {
      const res = await fetch(`/api/safety/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          reason,
          details: kind === 'report' ? { source: 'ui', page: window.location.pathname } : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : `Failed to ${kind} user`);
      }

      onActionComplete?.(kind);
      router.refresh();

      if (kind === 'block' || kind === 'unmatch') {
        router.push('/matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${kind} user`);
      setLoading(null);
      return;
    }

    setLoading(null);
  };

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'pt-1'}`}>
        <button
          type="button"
          onClick={() => runAction('report')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
        >
          <AlertTriangle size={14} />
          {loading === 'report' ? 'Reporting...' : 'Report user'}
        </button>

        <button
          type="button"
          onClick={() => runAction('unmatch')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 disabled:opacity-60"
        >
          <UserX size={14} />
          {loading === 'unmatch' ? 'Unmatching...' : 'Unmatch'}
        </button>

        <button
          type="button"
          onClick={() => runAction('block')}
          disabled={Boolean(loading)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
        >
          <Ban size={14} />
          {loading === 'block' ? 'Blocking...' : 'Block user'}
        </button>
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
