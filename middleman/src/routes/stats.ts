import Router from 'express';
import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { queue } from '../queue/queue.js';

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const stats = {
            totalWebhooks: 0,
            totalDeliveries: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            failedJobs: 0,
            successRate: 0,
        };

        const [totalWebhooks, totalDeliveries, successfulDeliveries, failedDeliveries] = await prisma.$transaction([
            prisma.webhook.count(),
            prisma.deliveryLog.count(),
            prisma.deliveryLog.count({ where: { status: 'success' } }),
            prisma.deliveryLog.count({ where: { status: 'failed' } })
        ]);

        const failedJobs = (await queue.getFailed()).length;
        const successRate = totalDeliveries > 0 
        ? parseFloat(((successfulDeliveries / totalDeliveries) * 100).toFixed(2)) : 0;

        stats.totalWebhooks = totalWebhooks;
        stats.totalDeliveries = totalDeliveries;
        stats.successfulDeliveries = successfulDeliveries;
        stats.failedDeliveries = failedDeliveries;
        stats.successRate = successRate;
        stats.failedJobs = failedJobs;

        console.log("Fetched stats");
        res.status(200).json(stats);
    } catch (err) {
        console.log("Failed to fetch stats: ", err);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
});

router.get('/today', async (req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalDeliveries, successfulDeliveries, failedDeliveries] = await prisma.$transaction([
      prisma.deliveryLog.count({
        where: { timestamp: { gte: startOfDay } }
      }),
      prisma.deliveryLog.count({
        where: { status: 'success', timestamp: { gte: startOfDay } }
      }),
      prisma.deliveryLog.count({
        where: { status: 'failed', timestamp: { gte: startOfDay } }
      }),
    ]);

    const successRate = totalDeliveries > 0
      ? parseFloat(((successfulDeliveries / totalDeliveries) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate,
    });
  } catch (err) {
    console.error('Failed to fetch today stats:', err);
    res.status(500).json({ message: 'Failed to fetch today stats' });
  }
});

export default router;