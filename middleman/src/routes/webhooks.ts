import { randomUUID } from 'crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string ?? '1');
    const limit = parseInt(req.query.limit as string ?? '20');
    const skip = (page - 1) * limit;

    const [webhooks, total] = await prisma.$transaction([
      prisma.webhook.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhook.count(),
    ]);

    res.status(200).json({
      data: webhooks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Failed to fetch webhooks:', err);
    res.status(500).json({ message: 'Failed to fetch webhooks' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { url, events } = req.body;

  try {
    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        secret: randomUUID(),
        apiKey: `API_${randomUUID()}`,
      },
    });

    console.log(`Webhook registered: ${webhook.url} for events: ${webhook.events.join(', ')}`);
    res.status(201).json(webhook);
  } catch (err) {
    console.error('Failed to register webhook:', err);
    res.status(500).json({ message: 'Failed to register webhook' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const webhookId = req.params.id as string;

  try {
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
      }
    });

    if(!webhook) {
      res.status(404).json({ message: "Webhook not found" });
      return;
    }

    console.log(`Webhook found: ${webhook}`);
    res.json(webhook);
  } catch (err) {
    console.error('Failed to fetch webhook:', err);
    res.status(500).json({ message: 'Failed to fetch webhook' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const webhookId = req.params.id as string;

  try {
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    console.log(`Webhook deleted: ${webhookId}`);
    res.status(200).json({ message: `Webhook deleted: ${webhookId}` });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }
    console.error('Could not delete webhook:', err);
    res.status(500).json({ message: 'Could not delete webhook' });
  }
});

export default router;