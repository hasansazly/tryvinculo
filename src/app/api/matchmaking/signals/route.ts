import { NextRequest, NextResponse } from 'next/server';
import { ingestMatchmakingSignal } from '@/server/matchmaking/service';
import type { MatchmakingSignalType } from '@/server/matchmaking/types';

function isSignalType(value: string): value is MatchmakingSignalType {
  return (
    value === 'profile_view' ||
    value === 'like' ||
    value === 'pass' ||
    value === 'message_sent' ||
    value === 'message_received' ||
    value === 'spark_answered' ||
    value === 'date_planned' ||
    value === 'report'
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const actorUserId = String(body.actorUserId ?? '');
    const targetUserId = String(body.targetUserId ?? '');
    const idempotencyKey = String(body.idempotencyKey ?? '');
    const type = String(body.type ?? '');
    const metadata =
      typeof body.metadata === 'object' && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : undefined;

    if (!actorUserId || !targetUserId || !idempotencyKey || !isSignalType(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid payload. Required: actorUserId, targetUserId, idempotencyKey, and valid signal type.',
        },
        { status: 400 }
      );
    }

    const result = await ingestMatchmakingSignal({
      actorUserId,
      targetUserId,
      idempotencyKey,
      type,
      metadata,
    });
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (err) {
    console.error('POST matchmaking signal error:', err);
    return NextResponse.json({ error: 'Failed to ingest signal' }, { status: 500 });
  }
}

