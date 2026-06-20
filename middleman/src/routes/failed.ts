import { Router } from 'express';
import type { Request, Response } from 'express';
import { queue } from '../queue/queue.js';

const router = Router();

// List all failed jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const failedJobs = await queue.getFailed();
    
    const jobs = failedJobs.map(job => ({
      jobId: job.id,
      event: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));

    res.status(200).json({data: jobs});
  } catch (err) {
    console.error('Failed to fetch failed jobs:', err);
    res.status(500).json({ message: 'Failed to fetch failed jobs' });
  }
});

// Replay a specific failed job
router.post('/:id/replay', async (req: Request, res: Response) => {
  try {
    const job = await queue.getJob(req.params.id as string);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    await job.retry();
    console.log(`Job ${job.id} requeued for replay`);
    res.status(200).json({ message: 'Job requeued', jobId: job.id });
  } catch (err) {
    console.error('Failed to replay job:', err);
    res.status(500).json({ message: 'Failed to replay job' });
  }
});

router.post('/replay-all', async (req: Request, res: Response) => {
  try {
    const jobs = await queue.getFailed();

    if (jobs.length === 0) {
      res.status(404).json({ message: 'Jobs not found' });
      return;
    }

    for (const job of jobs) {
      await job.retry();
    }

    console.log('Jobs restarted');
    res.status(202).json({ message: "Jobs restarted" });
  } catch (err) {
    console.log('Failed to restart jobs');
    res.status(500).json({ message: "Failed to restart jobs" });
  }
});

export default router;