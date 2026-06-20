import 'dotenv/config';
import express from 'express';
import eventsRouter from './src/routes/events.js';
import webhooksRouter from './src/routes/webhooks.js';
import './src/workers/deliveryWorker.js';
import failedEventsRouter from './src/routes/failed.js';
import logsRouter from './src/routes/logs.js';
import { startWorker } from './src/workers/deliveryWorker.js';
import statsRouter from './src/routes/stats.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

startWorker();
//middleware routes for /events 
app.use('/events', eventsRouter);

//middleware routes for /webhooks
app.use('/webhooks', webhooksRouter);

//middleware routes for failed jobs
app.use('/failed', failedEventsRouter);

//middleware routes for logs
app.use('/logs', logsRouter);

//middleware routes for stats
app.use('/stats', statsRouter);

app.listen(process.env.PORT, () => {
    console.log(`Middleman server running on port ${process.env.PORT}`);
});