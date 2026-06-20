import { createHmac, timingSafeEqual } from 'crypto';

export function signPayload(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

export function verifySignature(payload: string, secret: string, signature: string): boolean {
  const expected = signPayload(payload, secret);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}