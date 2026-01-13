# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyAutoWhiz is an AI-powered vehicle intelligence platform with three core features:
1. **Used Vehicle Research** - VIN decoding, recalls, safety ratings via NHTSA API
2. **Diagnostic & Repair Assistance** - AI chat with OpenAI vision for photo analysis
3. **Repair Shop Discovery** - Google Places integration for finding shops

## Monorepo Structure

This is a pnpm + Turborepo monorepo:
- `apps/web` - Next.js 15 frontend (port 3000)
- `apps/api` - Express API server (port 4000)
- `apps/worker` - BullMQ background job processor
- `apps/ios` - Swift/SwiftUI mobile app
- `packages/shared` - Shared types, constants, and Zod validation schemas

## Commands

```bash
# Development
pnpm install              # Install all dependencies
pnpm dev                  # Start all services (web, api, worker)
docker compose up -d      # Start PostgreSQL and Redis

# Database (Prisma schema at apps/api/prisma/schema.prisma)
pnpm db:migrate           # Run migrations (production)
pnpm db:migrate:dev       # Run migrations (development, creates migration files)
pnpm db:generate          # Regenerate Prisma client after schema changes
pnpm db:seed              # Seed database
pnpm db:studio            # Open Prisma Studio GUI
pnpm db:reset             # Reset database (destructive)

# Testing
pnpm test                             # All tests
pnpm test:api                         # API tests only (Vitest)
pnpm --filter api test -- src/path    # Single test file

# Quality
pnpm lint                 # ESLint all packages
pnpm typecheck            # TypeScript check all packages
pnpm format               # Prettier format all files

# Build
pnpm build                # Build all packages
pnpm --filter api build   # Build specific package
```

## Architecture

### API Layer (apps/api)
- **Routes** (`src/routes/`) - Express routers, all prefixed with `/api/v1/`
- **Controllers** (`src/controllers/`) - Request handlers using `catchAsync` wrapper
- **Services** (`src/services/`) - Business logic, external API calls
- **Middleware** (`src/middleware/`) - Auth, validation, rate limiting, error handling

Standard response helpers in `src/utils/response.ts`:
```typescript
sendSuccess(res, data)           // 200 with { success: true, data }
sendCreated(res, data)           // 201
sendPaginated(res, items, total, page, pageSize)
sendError(res, statusCode, code, message, details?)
```

### Request Validation
Use Zod schemas from `@myautowhiz/shared`:
```typescript
import { decodeVinSchema } from '@myautowhiz/shared';
const { vin } = decodeVinSchema.parse(req.body);
```

Middleware helpers: `validateBody()`, `validateQuery()`, `validateParams()`, `validateRequest()`

### Background Jobs (apps/worker)
BullMQ queues defined in `src/queues/index.ts`:
- `email` - Email sending via Resend
- `recall-check` - Periodic recall checks for saved vehicles
- `usage-reset` - Monthly/daily usage counter resets
- `data-retention` - Cleanup of old logs/sessions
- `cache-refresh` - Refresh stale cached data

### Web Frontend (apps/web)
- Next.js 15 App Router (`src/app/`)
- Route groups: `(auth)` for login/register, `(dashboard)` for authenticated pages
- State: Zustand stores in `src/stores/`, TanStack Query for server state
- UI: shadcn/ui components in `src/components/ui/`

### Shared Package (packages/shared)
Import as `@myautowhiz/shared`:
- `src/types/` - TypeScript interfaces (User, Vehicle, Chat, etc.)
- `src/validation/` - Zod schemas for API request/response validation
- `src/constants/` - Subscription tiers, rate limits, error codes

## Key Patterns

### Authentication
- JWT access tokens (15 min) + refresh tokens (30 days in database)
- `requireAuth` middleware validates JWT and attaches `req.user`
- Refresh tokens stored in `RefreshToken` model

### Subscription Tiers
Enum values: `FREE`, `PRO`, `FAMILY`, `DEALER`
Usage limits defined in `packages/shared/src/constants/limits.ts`

### OpenAI Integration
`apps/api/src/services/openai.service.ts` implements:
- Streaming chat with function calling (`streamChat`)
- Available functions: `decode_vin`, `lookup_recalls`, `get_safety_ratings`, `estimate_repair_cost`, `find_nearby_shops`, `get_maintenance_schedule`
- Image analysis for vehicle diagnostics (`analyzeImage`)

### External APIs
- **NHTSA** (`nhtsa.service.ts`) - VIN decoding, recalls, safety ratings
- **Google Places** (`shop.service.ts`) - Repair shop search
- **Stripe** (`subscription.service.ts`) - Payments and subscriptions
- **Resend** (`email.service.ts`) - Transactional emails

## Environment Variables

Required:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myautowhiz
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secure-key>
JWT_REFRESH_SECRET=<secure-key>
OPENAI_API_KEY=<key>
GOOGLE_PLACES_API_KEY=<key>
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<key>
RESEND_API_KEY=<key>
```

## Deployment

Railway deployment configured in `railway.json`:
- Health check endpoint: `/api/v1/health`
- Nixpacks builder with auto-detection
