import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSmsConfigured, sendSms } from '@/server/sms/twilio';

const SendSmsSchema = z.object({
  to: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'to must be E.164 format, e.g. +15551234567'),
  body: z
    .string()
    .trim()
    .min(1)
    .max(320, 'body too long (max 320 characters)'),
});

export async function POST(req: NextRequest) {
  try {
    if (!isSmsConfigured()) {
      return NextResponse.json(
        { error: 'SMS not configured. Set Twilio environment variables first.' },
        { status: 503 }
      );
    }

    const payload = SendSmsSchema.parse(await req.json());
    const result = await sendSms(payload);
    return NextResponse.json({ ok: true, message: result }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid SMS payload', issues: err.issues },
        { status: 400 }
      );
    }
    console.error('SMS send error:', err);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}

