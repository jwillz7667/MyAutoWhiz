# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyAutoWhiz is an AI-powered vehicle intelligence platform with three core features:
1. **Used Vehicle Research** - VIN decoding, recalls, safety ratings
2. **Diagnostic & Repair Assistance** - AI chat with GPT-5.2 vision for photo analysis
3. **Repair Shop Discovery** - Google Places integration for finding shops

The platform consists of:
- **Web App**: Next.js 15 with App Router (apps/web)
- **API Server**: Express + TypeScript (apps/api)
- **Background Worker**: BullMQ job processor (apps/worker)
- **iOS App**: Swift/SwiftUI (apps/ios)
- **Shared Package**: TypeScript types and Zod schemas (packages/shared)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TailwindCSS 4, shadcn/ui, Zustand, TanStack Query |
| Backend | Node.js 20, Express, TypeScript 5.3+, Prisma 5.10+ |
| Database | PostgreSQL 16 with PostGIS |
| Cache | Redis 7 |
| AI | OpenAI GPT-5.2 with function calling |
| External APIs | NHTSA (VIN/recalls/safety), Google Places, Stripe |
| Infrastructure | Railway, Cloudflare |

## Common Commands

```bash
# Install dependencies (from root)
pnpm install

# Start all services in development
pnpm dev

# Database operations
pnpm db:migrate        # Run migrations
pnpm db:generate       # Generate Prisma client
pnpm db:seed           # Seed database
pnpm db:studio         # Open Prisma Studio

# Run tests
pnpm test              # Run all tests
pnpm test:api          # API tests only
pnpm test:web          # Web tests only

# Single test file
pnpm --filter api test -- <test-file-path>

# Linting and formatting
pnpm lint              # Run ESLint
pnpm format            # Run Prettier

# Build
pnpm build             # Build all packages
pnpm --filter web build  # Build web only
pnpm --filter api build  # Build API only

# Type checking
pnpm typecheck
```

## Monorepo Structure

```
MyAutoWhiz/
├── apps/
│   ├── web/           # Next.js 15 (port 3000)
│   │   └── app/       # App Router pages
│   ├── api/           # Express API (port 4000)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   └── prisma/schema.prisma
│   ├── worker/        # BullMQ background jobs
│   └── ios/           # Swift/SwiftUI app
├── packages/
│   └── shared/        # Shared types, constants, Zod schemas
└── scripts/           # Development scripts
```

## Architecture Patterns

### API Routes
- All endpoints prefixed with `/api/v1/`
- Standard response format: `{ success: boolean, data?: T, error?: { code, message, details } }`
- Use Zod schemas from `packages/shared` for request validation
- Controllers call services; services contain business logic

### Authentication
- JWT access tokens (15 min) + refresh tokens (30 days)
- Refresh tokens stored in database, access tokens in memory/Keychain
- Middleware validates JWT and attaches user to request

### Subscription Tiers
- FREE, PRO ($9.99), FAMILY ($19.99), DEALER ($99.99)
- Each tier has usage limits (VIN lookups, chat messages, image analyses)
- Rate limiting enforced via Redis

### Caching Strategy
- VIN decode results: 24 hours in Redis
- Shop search results: 1 hour
- Session data: Redis

### OpenAI Integration
- Uses Responses API with function calling
- Functions: `decode_vin`, `lookup_recalls`, `estimate_repair_cost`, `find_nearby_shops`
- Supports vision for image analysis of vehicle issues

## Database Schema Key Models

- **User**: Subscription tier, usage counters, OAuth connections
- **Vehicle**: VIN, decoded data, cached recalls/safety ratings
- **ChatSession/ChatMessage**: AI conversation history with function call logs
- **DiagnosticSession**: Symptoms, OBD codes, images, AI analysis
- **RepairShop**: Cached Google Places data with geo coordinates

## Environment Variables

Required for local development:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myautowhiz
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-secure-key>
JWT_REFRESH_SECRET=<generate-secure-key>
OPENAI_API_KEY=<your-key>
GOOGLE_PLACES_API_KEY=<your-key>
STRIPE_SECRET_KEY=<your-key>
STRIPE_WEBHOOK_SECRET=<your-key>
RESEND_API_KEY=<your-key>
```

## Local Development Setup

1. Start local services:
```bash
docker compose up -d  # PostgreSQL and Redis
```

2. Set up database:
```bash
pnpm db:migrate
pnpm db:seed
```

3. Start development:
```bash
pnpm dev
```

## Key Implementation Notes

- Always validate user input on both client and server
- Use TypeScript strict mode; avoid `any` types
- Handle loading and error states in all UI components
- Log errors with context for debugging (use structured JSON logging)
- Paginate all list queries (avoid unbounded queries)
- Use Prisma includes/joins to avoid N+1 queries
- Cache aggressively but invalidate appropriately
