
import express from 'express';
import type { Request, Response } from 'express';
import { verifySignature } from './lib/signing.js';

const app = express();
const PORT = 4000;

// Secret received when registering the webhook — in production store in .env
const WEBHOOK_SECRET = '8dceed00-1fe1-4877-ab16-e8929448fae7'

app.use(express.json());

const receivedEvents: object[] = [];

app.post('/webhook', (req: Request, res: Response) => {
  console.log('Request received');
  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  if (!signature) {
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  const isValid = verifySignature(rawBody, WEBHOOK_SECRET, signature);

  if (!isValid) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = req.body;

  console.log('\n--- Webhook received ---');
  console.log('Event type :', payload.type);
  console.log('Event ID   :', payload.id);
  console.log('Data       :', JSON.stringify(payload.data, null, 2));
  console.log('Signature  : valid ✓');

  receivedEvents.push({
    receivedAt: new Date().toISOString(),
    ...payload,
  });

  res.status(200).json({ received: true });
});

app.get('/events', (req: Request, res: Response) => {
  res.json(receivedEvents);
});

app.listen(PORT, () => {
  console.log(`Consumer listening on http://localhost:${PORT}`);
});