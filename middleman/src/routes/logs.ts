import Router from 'express';
import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string ?? '1');
    const limit = parseInt(req.query.limit as string ?? '20');
    const status = req.query.status as string | undefined;
    const webhookId = req.query.webhookId as string | undefined;
    const eventType = req.query.eventType as string | undefined;

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(webhookId && { webhookId }),
      ...(eventType && { eventType }),
    };

    const [logs, total] = await prisma.$transaction([
      prisma.deliveryLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deliveryLog.count({ where }),
    ]);

    res.status(200).json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Failed to fetch logs:', err);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

export default router;