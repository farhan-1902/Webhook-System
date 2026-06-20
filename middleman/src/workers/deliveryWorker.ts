import { Worker, Job } from 'bullmq';
import { connection } from '../queue/queue.js';
import type { IEvent } from '../interfaces/data.i.js';
import { signPayload } from '../../lib/signing.js';
import prisma from '../db/prisma.js';

export function startWorker() {
  const worker = new Worker('events', async (job: Job<IEvent>) => {
    const event = job.data;
    console.log(`Processing job ${job.id} — event type: ${event.type}`);

    const subscribedWebhooks = await prisma.webhook.findMany({
      where: {
        events: { has: event.type },
        apiKey: event.apiKey,
      },
    });

    if (subscribedWebhooks.length === 0) {
      throw new Error(`No subscribers found for event type: ${event.type}`);
    }

    for (const webhook of subscribedWebhooks) {
      const start = Date.now();
      try {
        const signature = signPayload(JSON.stringify(event), webhook.secret);
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': signature,
          },
          body: JSON.stringify(event),
        });

        const latency = Date.now() - start;

        await prisma.deliveryLog.create({
          data: {
            jobId: job.id!,
            webhookId: webhook.id,
            eventType: event.type,
            url: webhook.url,
            status: response.ok ? 'success' : 'failed',
            statusCode: response.status,
            attemptNumber: job.attemptsMade,
            latency,
          },
        });

        if (!response.ok) {
          throw new Error(`Delivery failed with status ${response.status}`);
        }

        console.log(`Delivered event ${event.type} to ${webhook.url} in ${latency}ms`);
      } catch (err) {
        const latency = Date.now() - start;

        await prisma.deliveryLog.create({
          data: {
            jobId: job.id!,
            webhookId: webhook.id,
            eventType: event.type,
            url: webhook.url,
            status: 'failed',
            statusCode: null,
            attemptNumber: job.attemptsMade,
            latency,
          },
        });

        console.error(`Failed to deliver event ${event.type} to ${webhook.url}:`, err);
        throw err;
      }
    }
  }, { connection });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}