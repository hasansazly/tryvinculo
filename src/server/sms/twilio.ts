import twilio from 'twilio';

export interface SmsSendInput {
  to: string;
  body: string;
}

export interface SmsSendResult {
  sid: string;
  status: string | null;
  to: string;
}

function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are missing: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN');
  }
  if (!from && !messagingServiceSid) {
    throw new Error('Twilio sender missing: TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID required');
  }

  return { accountSid, authToken, from, messagingServiceSid };
}

export async function sendSms(input: SmsSendInput): Promise<SmsSendResult> {
  const config = getConfig();
  const client = twilio(config.accountSid, config.authToken);

  const message = await client.messages.create({
    to: input.to,
    body: input.body,
    from: config.messagingServiceSid ? undefined : config.from,
    messagingServiceSid: config.messagingServiceSid,
  });

  return {
    sid: message.sid,
    status: message.status ?? null,
    to: message.to,
  };
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  );
}

