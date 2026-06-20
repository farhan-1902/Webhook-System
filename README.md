# Hooked — Webhook Delivery System

A production-style webhook delivery platform built to demonstrate reliable event delivery infrastructure — the same pattern used by Stripe, GitHub, and Shopify to notify external services when something happens.

The system receives events from producers, queues them, and reliably delivers them to registered consumer URLs with automatic retries, exponential backoff, HMAC signature verification, and a dead-letter queue for failed deliveries.

## Why this exists

Webhooks look simple on the surface — just an HTTP POST when something happens. But making that delivery *reliable* requires solving real distributed systems problems: what happens when the receiving server is down, how do you prove a payload wasn't forged, and how do you recover events that failed delivery. This project builds that infrastructure from scratch.

## Architecture

```
┌──────────┐       ┌──────────────────────────────┐       ┌──────────┐
│ Producer │ POST  │          Middleman            │ POST  │ Consumer │
│ (sim.js) ├──────>│  /events                      ├──────>│ /webhook │
└──────────┘       │     │                         │       └──────────┘
                    │     ▼                         │
                    │  BullMQ Queue (Redis)         │
                    │     │                         │
                    │     ▼                         │
                    │  Delivery Worker              │
                    │   - HMAC sign payload         │
                    │   - POST to consumer URL      │
                    │   - retry w/ exponential      │
                    │     backoff on failure         │
                    │   - log every attempt          │
                    │     │                          │
                    │     ▼                          │
                    │  PostgreSQL (Prisma)           │
                    │   - Webhooks                   │
                    │   - DeliveryLogs                │
                    └──────────────────────────────┘
                              ▲
                              │ reads via REST API
                              │
                    ┌──────────────────┐
                    │  React Dashboard │
                    └──────────────────┘
```

**The three actors:**

- **Producer** — fires events into the system (e.g. "a payment succeeded"). Doesn't know or care who's listening.
- **Middleman** — the core engine. Accepts events, queues them, matches them to registered subscribers, delivers with retries, signs every payload, and records the full delivery history.
- **Consumer** — a registered endpoint that receives events and verifies they're authentic before trusting them.

## Project structure

```
.
├── middleman/          Core delivery engine (Express + BullMQ + Prisma)
├── consumer/           Example webhook receiver (Express)
├── dashboard/          React + TanStack Query admin UI
├── simulator.js        Script to register a webhook and fire test events
└── README.md
```

## Tech stack

| Layer            | Technology                          |
|------------------|--------------------------------------|
| API server        | Node.js, Express, TypeScript        |
| Queue             | BullMQ + Redis                      |
| Database          | PostgreSQL + Prisma ORM             |
| Frontend          | React, TanStack Query, Axios        |
| Security          | HMAC-SHA256 signed payloads         |

## How delivery works

1. A consumer registers a URL and the event types it cares about via `POST /webhooks`. The middleman returns a unique `secret` (for signature verification) and `apiKey` (for the producer to use).
2. A producer fires an event via `POST /events` with an `x-api-key` header. The middleman validates the key, stamps the event with an `id` and `timestamp`, and pushes it onto a BullMQ queue.
3. A background worker picks up the job, looks up every webhook subscribed to that event type **and** scoped to that `apiKey`, signs the payload with HMAC-SHA256, and POSTs it to each consumer URL.
4. The consumer verifies the signature using the shared secret before processing the payload — proving the request genuinely came from the middleman and wasn't forged.
5. If delivery fails (network error or non-2xx response), BullMQ retries with exponential backoff (1s → 2s → 4s → 8s → 16s) up to 5 attempts.
6. If all attempts fail, the job lands in the dead-letter queue, fully inspectable and replayable from the dashboard.
7. Every attempt — successful or not — is logged to Postgres with status code, latency, and attempt number.

## Security: HMAC signing

Every delivery includes an `x-webhook-signature` header:

```
x-webhook-signature: sha256=<hmac of payload using webhook's secret>
```

The consumer recomputes this signature using its stored secret and compares it with a timing-safe comparison (`crypto.timingSafeEqual`) before trusting the payload. This is the same pattern Stripe and GitHub use — it proves the request came from the middleman and wasn't tampered with or forged by a third party who discovered the consumer's URL.

## Multi-tenancy via API keys

Every webhook registration and every event is scoped to an `apiKey`. The worker only delivers an event to webhooks registered under the same `apiKey` as the event itself. This mirrors how Stripe routes a payment event only to the merchant it belongs to, rather than broadcasting it to every subscriber on the platform.

## API reference

### Webhooks
| Method | Endpoint          | Description                                  |
|--------|-------------------|-----------------------------------------------|
| POST   | `/webhooks`       | Register a webhook, returns `secret` + `apiKey` |
| GET    | `/webhooks`       | Paginated list of registered webhooks         |
| GET    | `/webhooks/:id`   | Get a single webhook                          |
| DELETE | `/webhooks/:id`   | Delete a webhook (cascades to its logs)        |

### Events
| Method | Endpoint   | Description                                            |
|--------|------------|----------------------------------------------------------|
| POST   | `/events`  | Ingest an event (requires `x-api-key` header). Queues for delivery. |

### Delivery Logs
| Method | Endpoint | Description                                                        |
|--------|----------|------------------------------------------------------------------------|
| GET    | `/logs`  | Paginated delivery logs. Filters: `status`, `webhookId`, `eventType` |

### Stats
| Method | Endpoint        | Description                              |
|--------|-----------------|--------------------------------------------|
| GET    | `/stats`        | Total webhooks, deliveries, success rate   |
| GET    | `/stats/today`  | Delivery breakdown for the current day     |

### Failed Jobs (Dead-letter queue)
| Method | Endpoint                  | Description                        |
|--------|---------------------------|--------------------------------------|
| GET    | `/failed`                 | List jobs that exhausted all retries |
| POST   | `/failed/:id/replay`      | Requeue a specific failed job        |
| POST   | `/failed/replay-all`      | Requeue every failed job             |

## Setup

### Prerequisites
- Node.js 18+
- Redis
- PostgreSQL

### 1. Clone and install

```bash
git clone <repo-url>
cd hooked

cd middleman && npm install
cd ../consumer && npm install
cd ../dashboard && npm install
```

### 2. Start Redis

```bash
redis-server
```

### 3. Set up PostgreSQL

```bash
psql postgres
CREATE DATABASE webhook_db;
\q
```

### 4. Configure environment variables

`middleman/.env`:
```env
DATABASE_URL="postgresql://<your-username>@localhost:5432/webhook_db"
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 5. Run migrations

```bash
cd middleman
npx prisma migrate dev
```

### 6. Start everything

```bash
# Terminal 1 — middleman
cd middleman && npm run dev

# Terminal 2 — consumer
cd consumer && npm run dev

# Terminal 3 — dashboard
cd dashboard && npm run dev
```

### 7. Run the simulator

```bash
node simulator.js
```

This registers a webhook, prints the secret, and fires a test event end to end. Copy the printed secret into `consumer/server.ts` before the event is delivered, so the consumer can verify the signature.

## What I'd do differently in production

- **Real authentication** instead of self-issued API keys — producers and consumers would authenticate via OAuth or signed JWTs rather than a key returned at registration time.
- **Live updates via SSE** instead of dashboard polling — the worker would push new delivery events to the browser as they happen rather than the dashboard refetching every 5 seconds.
- **Configured Redis eviction policy** (`noeviction`) and job retention limits so the queue can't silently lose jobs or grow unbounded under load.
- **Archiving old delivery logs** out of the hot path table into cold storage after a retention window, since audit logs only grow.
- **Alerting** (Slack/PagerDuty) on a webhook's failure rate crossing a threshold, instead of relying on someone manually checking the dead-letter queue.

## What this project demonstrates

- Asynchronous job processing and retry strategies with BullMQ
- Cryptographic message authentication (HMAC) and timing-safe comparison
- Relational data modeling with Prisma (foreign keys, cascading deletes)
- RESTful API design with pagination and filtering
- Multi-tenant scoping patterns
- React data-fetching patterns with TanStack Query (caching, mutations, cache invalidation, debounced inputs)