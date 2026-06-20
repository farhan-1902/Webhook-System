import { Router } from 'express';
import type { Request, Response } from 'express';
import type { IEvent } from '../interfaces/data.i.js';
import { queue } from '../queue/queue.js';
import { randomUUID } from 'crypto';
import prisma from '../db/prisma.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  try {
    const webhook = await prisma.webhook.findFirst({
      where: { apiKey }
    });

    if (!webhook) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    const event: IEvent = {
      ...req.body,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      apiKey
    };

    await queue.add('deliver', event);
    console.log(`Event queued: ${event.type} — id: ${event.id}`);
    res.status(202).json({ message: 'Event accepted', eventId: event.id });
  } catch (err) {
    console.error(`Failed to queue event:`, err);
    res.status(500).json({ message: 'Failed to queue event' });
  }
});

export default router;