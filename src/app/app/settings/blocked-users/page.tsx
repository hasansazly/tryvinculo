'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShieldOff } from 'lucide-react';

type BlockedItem = {
  userId: string;
  name: string;
  blockedAt: string;
};

export default function BlockedUsersPage() {
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/safety/blocks', { method: 'GET', cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { items?: BlockedItem[]; error?: string };
      if (!response.ok) {
        setError(payload.error || 'Unable to load blocked users right now.');
        return;
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Unable to load blocked users. ${message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleUnblock(userId: string) {
    setBusyUserId(userId);
    setError('');
    try {
      const response = await fetch('/api/safety/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error || 'Could not unblock this user right now.');
        return;
      }
      setItems((prev) => prev.filter((item) => item.userId !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Unable to unblock user. ${message}`);
    } finally {
      setBusyUserId(null);
    }
  }

  const subtitle = useMemo(() => {
    if (items.length === 1) return '1 user blocked';
    return `${items.length} users blocked`;
  }, [items.length]);

  return (
    <div className="app-interior-page" style={{ maxWidth: 760, margin: '0 auto', width: '100%', padding: '28px 16px calc(var(--app-main-bottom-clearance) + 16px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <Link
          href="/app/settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
            color: 'rgba(240,240,255,0.82)',
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} />
          Back to settings
        </Link>
        <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.6)' }}>{subtitle}</span>
      </div>

      <div className="glass" style={{ borderRadius: 20, background: '#FFFFFF', border: '1px solid #E5E3DF', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #ECE9E2', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldOff size={16} color="#f43f5e" />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Blocked Users</span>
        </div>

        {loading ? (
          <div style={{ padding: 20, fontSize: 14, color: '#6B7280' }}>Loading blocked users…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>No blocked users</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
              When you block someone, they will show here and you can unblock them anytime.
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {items.map((item) => (
              <div key={item.userId} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    Blocked on {new Date(item.blockedAt).toLocaleDateString('en-US')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(item.userId)}
                  disabled={busyUserId === item.userId}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(244,63,94,0.28)',
                    background: 'rgba(244,63,94,0.08)',
                    color: '#B42338',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 12px',
                    cursor: busyUserId === item.userId ? 'default' : 'pointer',
                    opacity: busyUserId === item.userId ? 0.6 : 1,
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {busyUserId === item.userId ? 'Unblocking…' : 'Unblock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div style={{ marginTop: 12, borderRadius: 12, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)', color: '#fecaca', padding: '10px 12px', fontSize: 12 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

