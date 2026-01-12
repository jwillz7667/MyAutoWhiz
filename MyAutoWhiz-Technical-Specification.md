# MyAutoWhiz Technical Specification

## AI-Powered Vehicle Intelligence Platform

**Version:** 1.0  
**Date:** January 2026  
**Domain:** myautowhiz.com  
**Repository:** https://github.com/jwillz7667/MyAutoWhiz.git  
**Target Revenue:** $10,000+/month  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Model & Revenue Strategy](#2-business-model--revenue-strategy)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Database Architecture](#5-database-architecture)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Specification](#7-api-specification)
8. [OpenAI GPT-5.2 Integration](#8-openai-gpt-52-integration)
9. [External API Integrations](#9-external-api-integrations)
10. [Web Application](#10-web-application)
11. [iOS Application](#11-ios-application)
12. [Real-Time Features](#12-real-time-features)
13. [Payment & Subscription System](#13-payment--subscription-system)
14. [Background Jobs & Scheduling](#14-background-jobs--scheduling)
15. [Railway Deployment](#15-railway-deployment)
16. [Security Implementation](#16-security-implementation)
17. [Testing Strategy](#17-testing-strategy)
18. [Monitoring & Analytics](#18-monitoring--analytics)
19. [Development Workflow](#19-development-workflow)
20. [Critical Implementation Notes](#20-critical-implementation-notes)

---

## 1. Executive Summary

### 1.1 Product Vision

MyAutoWhiz is a comprehensive AI-powered vehicle intelligence platform that serves three primary user needs:

1. **Used Vehicle Research** - Prospective buyers can research vehicles they're considering purchasing by decoding VINs, checking recalls, reviewing safety ratings, and getting AI-powered insights about reliability and common issues.

2. **Diagnostic & Repair Assistance** - Vehicle owners can describe symptoms, upload photos of problems, enter OBD-II diagnostic codes, and receive AI-powered diagnosis with step-by-step repair guidance.

3. **Repair Shop Discovery** - Users can find highly-rated, reputable repair shops in their area filtered by specialty, certifications, and user reviews.

### 1.2 Platform Components

The platform consists of two interconnected applications:

| Component | Description |
|-----------|-------------|
| **Web Application** | Next.js 15 responsive web app accessible at myautowhiz.com |
| **iOS Application** | Native Swift/SwiftUI app for iPhone and iPad |
| **Shared Backend** | Node.js/Express API server hosted on Railway |
| **Database** | PostgreSQL 16 with Redis caching on Railway |

Both applications connect to the same backend API and share user accounts, vehicle data, chat history, and subscription status. A user can start a diagnostic conversation on their iPhone and continue it on the web, or vice versa.

### 1.3 Revenue Model Summary

Monthly recurring revenue target of $10,000+ achieved through:

- **Subscription tiers** (Free, Pro $9.99, Family $19.99, Dealer $99.99)
- **Affiliate partnerships** with repair shops and parts retailers
- **Premium one-time reports** for detailed vehicle history

### 1.4 Key Differentiators

- **GPT-5.2 Integration** - Latest OpenAI model with vision capabilities for photo analysis
- **Authoritative Data Sources** - Direct integration with NHTSA databases (not third-party scrapers)
- **Function Calling** - AI can autonomously look up VINs, check recalls, estimate costs, and find shops
- **Cross-Platform Sync** - Seamless experience across web and mobile
- **Privacy-First** - No selling of user data; minimal data collection

---

## 2. Business Model & Revenue Strategy

### 2.1 Subscription Tiers

The subscription system uses four tiers with clear feature differentiation:

#### Free Tier ($0/month)
- **VIN Lookups:** 5 per month
- **AI Chat Messages:** 20 per month
- **Image Analyses:** 3 per month
- **Vehicles in Garage:** 1
- **Shop Finder:** Basic (10 results, no advanced filters)
- **Repair Guides:** Preview only (first 3 steps)
- **Ads:** Display ads on web, no ads in iOS app
- **Purpose:** Lead generation and conversion funnel entry point

#### Pro Tier ($9.99/month)
- **VIN Lookups:** Unlimited
- **AI Chat Messages:** 200 per day
- **Image Analyses:** 30 per month
- **Vehicles in Garage:** 3
- **Shop Finder:** Full (unlimited results, all filters, reviews)
- **Repair Guides:** Full access with video links
- **Maintenance Reminders:** Email and push notifications
- **Chat History:** 90 days retention
- **Ads:** None
- **Purpose:** Primary revenue driver for individual users

#### Family Tier ($19.99/month)
- **Everything in Pro, plus:**
- **Vehicles in Garage:** 10
- **AI Chat Messages:** 500 per day
- **Image Analyses:** 100 per month
- **Family Sharing:** Up to 5 family members on one subscription
- **Maintenance Calendar:** Shared family vehicle calendar
- **Chat History:** 1 year retention
- **Priority Support:** Email response within 24 hours
- **Purpose:** Multi-vehicle households

#### Dealer Tier ($99.99/month)
- **Everything in Family, plus:**
- **Vehicles:** Unlimited
- **AI Messages:** Unlimited
- **Image Analyses:** Unlimited
- **API Access:** Direct API access for integrations
- **Bulk VIN Decode:** Upload CSV of VINs for batch processing
- **White-Label Reports:** PDF reports with optional custom branding
- **Dedicated Support:** Phone and chat support
- **Analytics Dashboard:** Usage statistics and trends
- **Purpose:** Dealerships, mechanics, fleet managers

### 2.2 Revenue Projections

| Revenue Stream | Monthly Target | Calculation |
|----------------|----------------|-------------|
| Pro Subscriptions | $5,000 | 500 users × $9.99 |
| Family Subscriptions | $2,000 | 100 users × $19.99 |
| Dealer Subscriptions | $1,500 | 15 dealers × $99.99 |
| Affiliate Revenue | $1,000 | Shop referrals, parts links |
| Premium Reports | $500 | One-time detailed reports |
| **TOTAL** | **$10,000+** | |

### 2.3 Affiliate Partnerships

Implement affiliate tracking for the following revenue streams:

1. **Repair Shop Referrals**
   - Partner with RepairPal and AAA-approved shops
   - Track when users contact shops through the app
   - Commission: $5-15 per qualified lead

2. **Auto Parts Links**
   - Integrate with RockAuto, AutoZone, O'Reilly affiliate programs
   - When AI recommends parts, include affiliate links
   - Commission: 5-8% of purchase

3. **Vehicle History Reports**
   - Partner with CARFAX for premium report upsells
   - When user decodes VIN, offer detailed history report
   - Commission: $3-5 per report sold

4. **Vehicle Sales Leads**
   - Partner with Carvana, CarMax, local dealers
   - When user is researching to buy, offer instant quotes
   - Commission: $25-100 per qualified lead

### 2.4 Conversion Funnel

The product is designed to convert free users to paid:

```
Visitor → Free Signup → First VIN Lookup → Hit Free Limit → Upgrade Prompt → Pro Subscriber
                                ↓
                        First Diagnostic Chat → Detailed Answer → See "Pro Only" Guide → Upgrade
                                ↓
                        Add Second Vehicle → Hit Vehicle Limit → Family Tier Upgrade
```

**Key Conversion Points:**
- Show "Pro feature" badges on locked content
- When hitting limits, show personalized upgrade modal
- Offer 7-day free trial of Pro tier
- Send win-back emails to churned subscribers

---

## 3. System Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐                    ┌──────────────────────────┐     │
│   │   iOS App        │                    │   Next.js Web App        │     │
│   │   (Swift/SwiftUI)│                    │   (React/TypeScript)     │     │
│   │                  │                    │                          │     │
│   │   • Garage       │                    │   • Server Components    │     │
│   │   • AI Chat      │                    │   • Client Components    │     │
│   │   • Diagnostics  │                    │   • API Routes           │     │
│   │   • Shop Finder  │                    │   • SEO Optimization     │     │
│   │   • VIN Scanner  │                    │                          │     │
│   └────────┬─────────┘                    └─────────────┬────────────┘     │
│            │                                            │                   │
│            │         HTTPS/WSS                          │                   │
└────────────┼────────────────────────────────────────────┼───────────────────┘
             │                                            │
             ▼                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EDGE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Cloudflare                                      │   │
│   │   • DNS Management (myautowhiz.com)                                 │   │
│   │   • SSL/TLS Termination                                             │   │
│   │   • DDoS Protection                                                 │   │
│   │   • Edge Caching (static assets)                                    │   │
│   │   • Rate Limiting (100 req/min per IP)                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER (Railway)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Railway Load Balancer                             │   │
│   └───────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                          │
│         ┌─────────────────────────┼─────────────────────────┐               │
│         ▼                         ▼                         ▼               │
│   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐        │
│   │  Next.js App  │       │  API Server   │       │  Worker       │        │
│   │  (SSR/Static) │       │  (Express)    │       │  (Background) │        │
│   │               │       │               │       │               │        │
│   │  Port 3000    │       │  Port 4000    │       │  No Port      │        │
│   │  2 Replicas   │       │  3 Replicas   │       │  1 Instance   │        │
│   └───────────────┘       └───────────────┘       └───────────────┘        │
│                                   │                         │               │
└───────────────────────────────────┼─────────────────────────┼───────────────┘
                                    │                         │
                                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER (Railway)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐   ┌─────────────────┐   ┌─────────────────────┐   │
│   │   PostgreSQL 16     │   │   Redis 7       │   │   Railway Volumes   │   │
│   │                     │   │                 │   │                     │   │
│   │   • Users           │   │   • Sessions    │   │   • User Uploads    │   │
│   │   • Vehicles        │   │   • Rate Limits │   │   • Diagnostic      │   │
│   │   • Chat Sessions   │   │   • API Cache   │   │     Images          │   │
│   │   • Diagnostics     │   │   • Pub/Sub     │   │   • Generated       │   │
│   │   • Subscriptions   │   │                 │   │     Reports         │   │
│   │                     │   │   256MB Plan    │   │                     │   │
│   │   1GB RAM           │   │                 │   │   10GB Storage      │   │
│   │   10GB Storage      │   │                 │   │                     │   │
│   └─────────────────────┘   └─────────────────┘   └─────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│   │   OpenAI      │  │   NHTSA       │  │   Google      │  │   Stripe    │  │
│   │   GPT-5.2     │  │   APIs        │  │   Places      │  │   Payments  │  │
│   │               │  │               │  │               │  │             │  │
│   │   • Chat      │  │   • VIN Decode│  │   • Shop      │  │   • Subs    │  │
│   │   • Vision    │  │   • Recalls   │  │     Search    │  │   • Portal  │  │
│   │   • Functions │  │   • Safety    │  │   • Details   │  │   • Webhook │  │
│   └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
│                                                                              │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│   │   Resend      │  │   Apple       │  │   Sentry      │                   │
│   │   Email       │  │   Push (APNs) │  │   Monitoring  │                   │
│   │               │  │               │  │               │                   │
│   │   • Transact  │  │   • Recalls   │  │   • Errors    │                   │
│   │   • Marketing │  │   • Reminders │  │   • Traces    │                   │
│   └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow Examples

#### Example 1: VIN Decode Request

```
1. User enters VIN in iOS app or web
2. Request hits Cloudflare (rate limit check, DDoS protection)
3. Request forwarded to Railway API server
4. API server validates JWT token from Authorization header
5. Check Redis cache for recent VIN decode (TTL: 24 hours)
6. If cache miss:
   a. Call NHTSA vPIC API to decode VIN
   b. Call NHTSA Safety Ratings API for crash test scores
   c. Call NHTSA Recalls API for active recalls
   d. Aggregate and normalize data
   e. Store in Redis cache
   f. Log lookup in PostgreSQL for analytics
7. Check user's subscription tier and remaining lookups
8. Decrement lookup counter if on free tier
9. Return decoded vehicle data to client
10. Client displays formatted results
```

#### Example 2: AI Diagnostic Chat Message

```
1. User types message describing car problem
2. Optional: User attaches photo of issue
3. Request sent to API with session context
4. API retrieves chat history from PostgreSQL
5. API retrieves user's vehicle context (year/make/model)
6. Build OpenAI Responses API request:
   a. System prompt with automotive expertise
   b. Vehicle context injection
   c. Chat history (last 20 messages)
   d. User's current message
   e. Image if attached (base64)
   f. Available function tools
7. Stream response via Server-Sent Events
8. If AI invokes function (e.g., lookup_repair_cost):
   a. Execute function server-side
   b. Return result to AI
   c. AI incorporates result into response
9. Store completed message in PostgreSQL
10. Update user's message counter
11. Client renders streamed response with typing indicator
```

### 3.3 Monorepo Structure

The entire project is organized as a monorepo for shared code and simplified deployment:

```
MyAutoWhiz/
├── apps/
│   ├── web/                    # Next.js 15 web application
│   │   ├── app/                # App Router pages and layouts
│   │   ├── components/         # React components
│   │   ├── lib/                # Utility functions
│   │   ├── styles/             # Global styles
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── api/                    # Express API server
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── middleware/     # Auth, rate limit, etc.
│   │   │   ├── services/       # Business logic
│   │   │   ├── models/         # Database models
│   │   │   ├── routes/         # Route definitions
│   │   │   ├── utils/          # Helpers
│   │   │   └── index.ts        # Entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── package.json
│   │
│   ├── worker/                 # Background job processor
│   │   ├── src/
│   │   │   ├── jobs/           # Job definitions
│   │   │   ├── queues/         # Queue configurations
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ios/                    # iOS application
│       ├── MyAutoWhiz/
│       │   ├── App/            # App lifecycle
│       │   ├── Features/       # Feature modules
│       │   ├── Core/           # Shared utilities
│       │   ├── UI/             # Reusable UI components
│       │   └── Resources/      # Assets, localization
│       ├── MyAutoWhiz.xcodeproj
│       └── Package.swift
│
├── packages/
│   ├── shared/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── types/          # API types, DTOs
│   │   │   ├── constants/      # Shared constants
│   │   │   └── validation/     # Zod schemas
│   │   └── package.json
│   │
│   └── eslint-config/          # Shared ESLint config
│
├── docs/                       # Documentation
│   ├── api/                    # API documentation
│   ├── architecture/           # Architecture diagrams
│   └── deployment/             # Deployment guides
│
├── scripts/                    # Development scripts
│   ├── setup.sh                # Initial setup
│   ├── seed.ts                 # Database seeding
│   └── generate-types.ts       # Type generation
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # PNPM workspaces
└── README.md
```

---

## 4. Technology Stack

### 4.1 Backend (API Server)

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime environment |
| TypeScript | 5.3+ | Type-safe development |
| Express | 4.18+ | HTTP server framework |
| Prisma | 5.10+ | Database ORM with type-safe queries |
| PostgreSQL | 16 | Primary relational database |
| Redis | 7 | Caching, sessions, rate limiting |
| BullMQ | 5+ | Background job queue |
| Zod | 3.22+ | Request/response validation |
| Passport | 0.7+ | Authentication strategies |
| Helmet | 7+ | Security headers |
| Morgan | 1.10+ | HTTP request logging |
| Winston | 3.11+ | Application logging |
| OpenAI SDK | 4.28+ | GPT-5.2 API integration |

### 4.2 Frontend (Web Application)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 | React framework with App Router |
| React | 19 | UI component library |
| TypeScript | 5.3+ | Type-safe development |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui | Latest | Accessible UI component library |
| Zustand | 4.5+ | Lightweight state management |
| React Hook Form | 7.50+ | Form handling |
| Zod | 3.22+ | Form validation |
| Tanstack Query | 5.20+ | Data fetching and caching |
| Mapbox GL JS | 3+ | Interactive maps for shop finder |
| Recharts | 2.12+ | Charts for analytics |
| Lucide React | 0.330+ | Icon library |

### 4.3 iOS Application

| Technology | Version | Purpose |
|------------|---------|---------|
| Swift | 5.9+ | Programming language |
| SwiftUI | iOS 17+ | Declarative UI framework |
| Swift Concurrency | - | async/await for networking |
| Combine | - | Reactive programming |
| VisionKit | - | Camera-based VIN scanning |
| MapKit | - | Native maps for shop finder |
| StoreKit 2 | - | In-app purchases |
| UserNotifications | - | Push notifications |
| Keychain Services | - | Secure credential storage |

### 4.4 Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| Railway | Hosting (API, Web, Database, Redis) |
| Cloudflare | DNS, CDN, SSL, DDoS protection |
| GitHub Actions | CI/CD pipelines |
| Sentry | Error tracking and performance monitoring |
| Resend | Transactional email delivery |
| Apple Push Notification service | iOS push notifications |

### 4.5 External APIs

| API | Purpose | Cost |
|-----|---------|------|
| OpenAI GPT-5.2 | AI chat, vision analysis | ~$5-15 per 1M tokens |
| NHTSA vPIC | VIN decoding | Free |
| NHTSA Safety Ratings | Crash test scores | Free |
| NHTSA Recalls | Active recall data | Free |
| Google Places API (New) | Repair shop search | $17-40 per 1K requests |
| Stripe | Payment processing | 2.9% + $0.30 per transaction |

---

## 5. Database Architecture

### 5.1 Database Choice: PostgreSQL 16 on Railway

PostgreSQL was chosen for the following reasons:

1. **JSON Support** - JSONB columns for flexible schema storage (vehicle decoded data, AI responses, preferences)
2. **Full-Text Search** - Native support for searching repair guides and diagnostic content
3. **PostGIS Extension** - Geospatial queries for shop finder (find shops within X miles)
4. **Reliability** - ACID compliance, point-in-time recovery, proven at scale
5. **Railway Integration** - First-class support with automatic backups, connection pooling

### 5.2 Complete Schema Definition

The following Prisma schema defines all database tables. Each table includes detailed comments explaining the purpose of fields.

```prisma
// This is your Prisma schema file
// Learn more at: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  emailVerified         Boolean   @default(false)
  emailVerificationToken String?
  passwordHash          String?   // Null if OAuth-only user
  fullName              String?
  avatarUrl             String?
  phone                 String?
  
  // Subscription
  subscriptionTier      SubscriptionTier @default(FREE)
  subscriptionStatus    SubscriptionStatus @default(ACTIVE)
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?
  subscriptionEndsAt    DateTime?
  trialEndsAt           DateTime?
  
  // Usage tracking (reset monthly)
  monthlyVinLookups     Int       @default(0)
  monthlyChatMessages   Int       @default(0)
  monthlyImageAnalyses  Int       @default(0)
  lastUsageReset        DateTime  @default(now())
  
  // OAuth connections
  oauthProvider         String?   // "google", "apple", "facebook"
  oauthProviderId       String?
  
  // Preferences (stored as JSON)
  preferences           Json      @default("{}")
  
  // Soft delete
  deletedAt             DateTime?
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  vehicles              Vehicle[]
  chatSessions          ChatSession[]
  diagnosticSessions    DiagnosticSession[]
  vinLookups            VinLookup[]
  maintenanceRecords    MaintenanceRecord[]
  refreshTokens         RefreshToken[]
  familyMembers         FamilyMember[]      @relation("FamilyOwner")
  memberOf              FamilyMember?       @relation("FamilyMember")
  
  @@index([email])
  @@index([stripeCustomerId])
  @@map("users")
}

enum SubscriptionTier {
  FREE
  PRO
  FAMILY
  DEALER
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

model RefreshToken {
  id          String   @id @default(uuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceInfo  String?  // User agent or device identifier
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  @@index([token])
  @@index([userId])
  @@map("refresh_tokens")
}

model FamilyMember {
  id          String   @id @default(uuid())
  ownerId     String
  owner       User     @relation("FamilyOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  memberId    String   @unique
  member      User     @relation("FamilyMember", fields: [memberId], references: [id], onDelete: Cascade)
  role        String   @default("member") // "owner" or "member"
  invitedAt   DateTime @default(now())
  acceptedAt  DateTime?
  
  @@map("family_members")
}

// ============================================================================
// VEHICLES
// ============================================================================

model Vehicle {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Core vehicle info
  vin             String
  nickname        String?   // User-assigned name like "Dad's Truck"
  
  // Decoded VIN data
  year            Int?
  make            String?
  model           String?
  trim            String?
  engine          String?
  transmission    String?
  drivetrain      String?
  fuelType        String?
  bodyType        String?
  exteriorColor   String?
  interiorColor   String?
  
  // User-entered data
  currentMileage  Int?
  purchaseDate    DateTime?
  purchasePrice   Decimal?  @db.Decimal(10, 2)
  licensePlate    String?
  
  // Cached API data (refreshed periodically)
  decodedData     Json?     // Full NHTSA decode response
  safetyRatings   Json?     // NHTSA crash test scores
  recallData      Json?     // Active recalls
  lastRecallCheck DateTime?
  
  // Status
  isPrimary       Boolean   @default(false)
  isActive        Boolean   @default(true)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  chatSessions       ChatSession[]
  diagnosticSessions DiagnosticSession[]
  maintenanceRecords MaintenanceRecord[]
  
  @@index([userId])
  @@index([vin])
  @@map("vehicles")
}

// ============================================================================
// AI CHAT
// ============================================================================

model ChatSession {
  id          String        @id @default(uuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicleId   String?
  vehicle     Vehicle?      @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
  
  // Session metadata
  sessionType ChatSessionType
  title       String?       // Auto-generated or user-set title
  status      ChatStatus    @default(ACTIVE)
  
  // Context for AI
  systemContext Json?       // Additional context injected into prompts
  
  // Timestamps
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  // Relations
  messages    ChatMessage[]
  
  @@index([userId])
  @@index([vehicleId])
  @@map("chat_sessions")
}

enum ChatSessionType {
  GENERAL         // General vehicle questions
  DIAGNOSTIC      // Troubleshooting a problem
  REPAIR_GUIDE    // Step-by-step repair assistance
  PURCHASE_ADVICE // Buying decision help
  MAINTENANCE     // Maintenance questions
}

enum ChatStatus {
  ACTIVE
  RESOLVED
  ARCHIVED
}

model ChatMessage {
  id          String      @id @default(uuid())
  sessionId   String
  session     ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Message content
  role        MessageRole
  content     String      @db.Text
  
  // Attachments (images for vision analysis)
  attachments Json        @default("[]") // Array of {type, url, mimeType}
  
  // Function calling
  functionCalls Json?     // Array of {name, arguments, result}
  
  // Token usage for billing
  promptTokens     Int?
  completionTokens Int?
  
  // Timestamps
  createdAt   DateTime    @default(now())
  
  @@index([sessionId])
  @@map("chat_messages")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  FUNCTION
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

model DiagnosticSession {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicleId   String?
  vehicle     Vehicle?  @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
  
  // User-reported issues
  symptoms    String[]  // Array of symptom descriptions
  obdCodes    String[]  // Array of OBD-II codes like "P0300"
  
  // Uploaded images
  images      Json      @default("[]") // Array of {url, description, analysisResult}
  
  // AI analysis
  aiAnalysis  Json?     // Structured diagnosis result
  
  // Recommendations
  suggestedRepairs  Json? // Array of {repair, estimatedCost, difficulty, urgency}
  estimatedCosts    Json? // {laborLow, laborHigh, partsLow, partsHigh}
  
  // Status
  urgencyLevel String?   // "low", "medium", "high", "critical"
  status       DiagnosticStatus @default(OPEN)
  resolvedAt   DateTime?
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
  @@index([vehicleId])
  @@map("diagnostic_sessions")
}

enum DiagnosticStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

// ============================================================================
// VIN LOOKUPS
// ============================================================================

model VinLookup {
  id          String    @id @default(uuid())
  userId      String?
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // VIN and lookup type
  vin         String
  lookupType  String    // "decode", "recalls", "safety", "full"
  
  // Results
  decodedData Json?
  safetyData  Json?
  recallData  Json?
  marketValue Json?
  
  // Source tracking
  source      String?   // "web", "ios", "api"
  
  // Caching
  cachedUntil DateTime?
  
  // Timestamps
  createdAt   DateTime  @default(now())
  
  @@index([userId])
  @@index([vin])
  @@map("vin_lookups")
}

// ============================================================================
// REPAIR SHOPS
// ============================================================================

model RepairShop {
  id              String    @id @default(uuid())
  googlePlaceId   String    @unique
  
  // Basic info
  name            String
  address         String?
  city            String?
  state           String?
  zipCode         String?
  country         String    @default("US")
  
  // Location (for geo queries)
  latitude        Decimal   @db.Decimal(10, 8)
  longitude       Decimal   @db.Decimal(11, 8)
  
  // Contact
  phone           String?
  website         String?
  
  // Ratings
  googleRating    Decimal?  @db.Decimal(2, 1)
  googleReviewCount Int?
  priceLevel      Int?      // 1-4 scale
  
  // Hours
  businessHours   Json?     // Structured hours by day
  
  // Specializations
  specialties     String[]  // ["brakes", "transmission", "electrical"]
  certifications  String[]  // ["ASE", "AAA Approved", "Dealer Certified"]
  
  // Partnership
  isVerified      Boolean   @default(false)
  isPartner       Boolean   @default(false)
  partnerCommission Decimal? @db.Decimal(5, 2)
  
  // Caching
  lastUpdated     DateTime  @default(now())
  cachedUntil     DateTime?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  maintenanceRecords MaintenanceRecord[]
  shopContacts       ShopContact[]
  
  @@index([googlePlaceId])
  @@map("repair_shops")
}

model ShopContact {
  id          String     @id @default(uuid())
  shopId      String
  shop        RepairShop @relation(fields: [shopId], references: [id], onDelete: Cascade)
  userId      String
  
  // Contact details
  name        String
  email       String
  phone       String?
  message     String     @db.Text
  
  // Tracking
  status      String     @default("pending") // "pending", "contacted", "converted"
  
  // Timestamps
  createdAt   DateTime   @default(now())
  
  @@map("shop_contacts")
}

// ============================================================================
// MAINTENANCE RECORDS
// ============================================================================

model MaintenanceRecord {
  id          String      @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Service details
  serviceType String      // "oil_change", "tire_rotation", "brake_service", etc.
  description String?     @db.Text
  
  // When/where
  serviceDate DateTime
  mileage     Int?
  shopId      String?
  shop        RepairShop? @relation(fields: [shopId], references: [id])
  shopName    String?     // Denormalized for deleted shops
  
  // Cost
  cost        Decimal?    @db.Decimal(10, 2)
  partsUsed   Json        @default("[]") // Array of {name, partNumber, cost}
  
  // Documentation
  receiptUrl  String?
  notes       String?     @db.Text
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@index([vehicleId])
  @@index([userId])
  @@map("maintenance_records")
}

// ============================================================================
// SUBSCRIPTIONS & BILLING
// ============================================================================

model SubscriptionEvent {
  id              String   @id @default(uuid())
  userId          String
  
  // Stripe data
  stripeEventId   String   @unique
  eventType       String   // "subscription.created", "invoice.paid", etc.
  eventData       Json
  
  // Processing
  processedAt     DateTime @default(now())
  
  @@index([userId])
  @@index([stripeEventId])
  @@map("subscription_events")
}

// ============================================================================
// ANALYTICS & LOGGING
// ============================================================================

model ApiLog {
  id          String   @id @default(uuid())
  userId      String?
  
  // Request details
  method      String
  path        String
  statusCode  Int
  responseTime Int     // milliseconds
  
  // Context
  userAgent   String?
  ipAddress   String?
  
  // Timestamps
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
  @@map("api_logs")
}
```

### 5.3 Database Indexes Explanation

Each index is critical for performance:

| Table | Index | Purpose |
|-------|-------|---------|
| users | email | Fast login lookup |
| users | stripeCustomerId | Webhook processing |
| vehicles | userId | Get user's vehicles |
| vehicles | vin | VIN lookup deduplication |
| chat_sessions | userId | Get user's chat history |
| chat_sessions | vehicleId | Get chats for a vehicle |
| chat_messages | sessionId | Load messages for session |
| vin_lookups | vin | Cache hit lookup |
| repair_shops | googlePlaceId | Deduplication |
| repair_shops | latitude, longitude | Geo queries (with PostGIS) |

### 5.4 Data Retention Policies

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| User accounts | Until deleted | Soft delete, 30-day grace period |
| Chat messages | Tier-based | Free: 30 days, Pro: 90 days, Family+: 1 year |
| Diagnostic sessions | 1 year | Valuable for pattern analysis |
| VIN lookups | 24 hours cache | Fresh data on re-lookup |
| API logs | 30 days | Debugging and analytics |
| Subscription events | 7 years | Legal/financial compliance |

---

## 6. Authentication & Authorization

### 6.1 Authentication Strategy

The platform supports multiple authentication methods:

1. **Email/Password** - Traditional registration with email verification
2. **Google OAuth** - Sign in with Google account
3. **Apple Sign In** - Required for iOS App Store compliance
4. **Facebook OAuth** - Optional social login

### 6.2 JWT Token Architecture

**Access Token:**
- Short-lived (15 minutes)
- Contains: userId, email, subscriptionTier, role
- Stored in memory (web) or Keychain (iOS)
- Sent in Authorization header: `Bearer <token>`

**Refresh Token:**
- Long-lived (30 days)
- Stored in database with device info
- Stored in httpOnly cookie (web) or Keychain (iOS)
- Used to obtain new access tokens
- Revocable (logout invalidates)

### 6.3 Authentication Flow Details

#### 6.3.1 Email/Password Registration

1. User submits email, password, and full name
2. Validate email format and password strength (min 8 chars, 1 number, 1 special)
3. Check if email already exists
4. Hash password using bcrypt with cost factor 12
5. Create user record with `emailVerified: false`
6. Generate verification token (UUID v4)
7. Store verification token with 24-hour expiration
8. Send verification email via Resend
9. Return access token and refresh token
10. User can access app but sees "verify email" banner

#### 6.3.2 Email Verification

1. User clicks link: `myautowhiz.com/verify-email?token=xxx`
2. Look up token in database
3. Check token not expired
4. Set `emailVerified: true`
5. Delete verification token
6. Redirect to dashboard with success message

#### 6.3.3 OAuth Flow (Google Example)

1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User grants permission
4. Google redirects to callback URL with authorization code
5. Exchange code for Google access token
6. Fetch user profile from Google
7. Check if user exists by oauthProviderId
8. If new user: create account, no password
9. If existing user: update profile if needed
10. Generate our access/refresh tokens
11. Redirect to dashboard

#### 6.3.4 Token Refresh

1. Access token expires (15 min)
2. Client detects 401 response
3. Client sends refresh token to `/api/auth/refresh`
4. Server validates refresh token exists and not expired
5. Generate new access token
6. Optionally rotate refresh token (sliding window)
7. Return new tokens
8. Client retries original request

### 6.4 Authorization Middleware

Every protected endpoint runs through authorization middleware:

```
1. Extract token from Authorization header
2. Verify JWT signature using secret
3. Check token not expired
4. Decode payload (userId, tier, role)
5. Fetch user from database (optional, for sensitive ops)
6. Check if account is active (not deleted, subscription not canceled)
7. Attach user to request object
8. Continue to route handler
```

### 6.5 Rate Limiting by Tier

Rate limits are enforced using Redis:

| Endpoint Category | Free | Pro | Family | Dealer |
|-------------------|------|-----|--------|--------|
| VIN Decode | 5/month | Unlimited | Unlimited | Unlimited |
| AI Chat Messages | 20/month | 200/day | 500/day | Unlimited |
| Image Analysis | 3/month | 30/month | 100/month | Unlimited |
| Shop Search | 10/day | 100/day | 100/day | Unlimited |
| API Requests | 100/min | 500/min | 500/min | 1000/min |

Rate limit exceeded returns:
- HTTP 429 Too Many Requests
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: <timestamp>`
- Body with upgrade prompt

### 6.6 Password Reset Flow

1. User requests reset: `/api/auth/forgot-password`
2. Generate reset token (UUID v4)
3. Store token with 1-hour expiration
4. Send email with reset link
5. User clicks link: `myautowhiz.com/reset-password?token=xxx`
6. User enters new password
7. Validate token, update password hash
8. Invalidate all refresh tokens (force re-login)
9. Send confirmation email
10. Redirect to login

---

## 7. API Specification

### 7.1 API Design Principles

- **RESTful** - Resource-based URLs, standard HTTP methods
- **Versioned** - All endpoints prefixed with `/api/v1/`
- **JSON** - Request and response bodies in JSON
- **Consistent Errors** - Standard error format across all endpoints
- **Documented** - OpenAPI 3.0 specification auto-generated
- **Typed** - Zod schemas for request validation, TypeScript for responses

### 7.2 Base URL

- **Production:** `https://api.myautowhiz.com/api/v1`
- **Development:** `http://localhost:4000/api/v1`

### 7.3 Common Headers

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>  (optional, for tracing)
X-Client-Version: 1.0.0  (optional, for compatibility)
```

**Response Headers:**
```
Content-Type: application/json
X-Request-ID: <uuid>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

### 7.4 Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid VIN format",
    "details": {
      "field": "vin",
      "received": "123",
      "expected": "17 alphanumeric characters"
    }
  },
  "requestId": "req_abc123"
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### 7.5 Authentication Endpoints

#### POST /auth/register
Create a new user account with email and password.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 8 chars, 1 number, 1 special char |
| fullName | string | Yes | User's full name |

**Success Response (201):**
| Field | Type | Description |
|-------|------|-------------|
| user | object | User profile (id, email, fullName, tier) |
| accessToken | string | JWT access token (15 min) |
| refreshToken | string | Refresh token (30 days) |

**Errors:**
- 400: Invalid email format, weak password
- 409: Email already registered

---

#### POST /auth/login
Authenticate with email and password.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Success Response (200):**
Returns user, accessToken, refreshToken.

**Errors:**
- 401: Invalid credentials
- 403: Email not verified (with resend option)

---

#### POST /auth/oauth/{provider}
Initiate OAuth flow.

**Path Parameters:**
- provider: "google", "apple", or "facebook"

**Query Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| redirectUri | string | Where to redirect after auth |
| state | string | CSRF protection token |

**Response:**
Redirects to OAuth provider's consent screen.

---

#### GET /auth/oauth/{provider}/callback
OAuth callback handler.

Handles code exchange, creates/updates user, returns tokens.
Redirects to web app or deep links to iOS app.

---

#### POST /auth/refresh
Exchange refresh token for new access token.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | Yes |

**Success Response (200):**
| Field | Type |
|-------|------|
| accessToken | string |
| refreshToken | string (if rotated) |

**Errors:**
- 401: Invalid or expired refresh token

---

#### POST /auth/logout
Invalidate current session.

**Headers:** Authorization required.

**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| refreshToken | string | Token to invalidate |
| allDevices | boolean | Logout from all devices |

**Success Response (200):**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

#### POST /auth/forgot-password
Request password reset email.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |

**Success Response (200):**
Always returns success (prevents email enumeration).

---

#### POST /auth/reset-password
Reset password with token.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| token | string | Yes |
| newPassword | string | Yes |

**Errors:**
- 400: Invalid or expired token, weak password

---

### 7.6 User Endpoints

#### GET /user/profile
Get current user's profile.

**Headers:** Authorization required.

**Success Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "avatarUrl": "https://...",
  "phone": "+1234567890",
  "emailVerified": true,
  "subscriptionTier": "PRO",
  "subscriptionStatus": "ACTIVE",
  "subscriptionEndsAt": "2024-02-15T00:00:00Z",
  "preferences": {
    "notifications": true,
    "theme": "dark"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

#### PUT /user/profile
Update user profile.

**Request Body:**
All fields optional: fullName, phone, avatarUrl, preferences.

---

#### GET /user/usage
Get current usage statistics.

**Success Response (200):**
```json
{
  "period": "2024-01",
  "vinLookups": {
    "used": 3,
    "limit": 5,
    "unlimited": false
  },
  "chatMessages": {
    "used": 15,
    "limit": 20,
    "unlimited": false
  },
  "imageAnalyses": {
    "used": 1,
    "limit": 3,
    "unlimited": false
  },
  "resetsAt": "2024-02-01T00:00:00Z"
}
```

---

#### DELETE /user/account
Delete user account.

Requires password confirmation. Soft deletes with 30-day grace period.

---

### 7.7 Vehicle Endpoints

#### GET /vehicles
Get all vehicles for current user.

**Query Parameters:**
| Field | Type | Default |
|-------|------|---------|
| includeInactive | boolean | false |

**Success Response (200):**
```json
{
  "vehicles": [
    {
      "id": "uuid",
      "vin": "1HGBH41JXMN109186",
      "nickname": "Family Car",
      "year": 2021,
      "make": "Honda",
      "model": "Accord",
      "trim": "Sport 2.0T",
      "currentMileage": 45000,
      "isPrimary": true,
      "hasActiveRecalls": true,
      "recallCount": 2,
      "lastRecallCheck": "2024-01-10T00:00:00Z"
    }
  ],
  "count": 1,
  "limit": 3  // Based on subscription tier
}
```

---

#### POST /vehicles
Add a new vehicle.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| vin | string | Yes | 17-character VIN |
| nickname | string | No | User-friendly name |
| currentMileage | number | No | Current odometer reading |
| purchaseDate | string | No | ISO date |
| purchasePrice | number | No | Purchase price |

**Processing Steps:**
1. Validate VIN format (17 chars, valid check digit)
2. Check user hasn't exceeded vehicle limit for tier
3. Call NHTSA API to decode VIN
4. Call NHTSA Safety API for ratings
5. Call NHTSA Recalls API for active recalls
6. Store vehicle with all decoded data
7. Return complete vehicle object

---

#### GET /vehicles/{id}
Get detailed vehicle information.

**Success Response (200):**
```json
{
  "id": "uuid",
  "vin": "1HGBH41JXMN109186",
  "nickname": "Family Car",
  "year": 2021,
  "make": "Honda",
  "model": "Accord",
  "trim": "Sport 2.0T",
  "engine": "2.0L Turbo I4 252hp",
  "transmission": "10-Speed Automatic",
  "drivetrain": "FWD",
  "fuelType": "Gasoline",
  "bodyType": "4-Door Sedan",
  "currentMileage": 45000,
  "purchaseDate": "2021-06-15",
  "purchasePrice": 32500.00,
  "safetyRatings": {
    "overall": 5,
    "frontalCrash": 5,
    "sideCrash": 5,
    "rollover": 4
  },
  "recalls": [
    {
      "campaignNumber": "21V573",
      "component": "FUEL SYSTEM",
      "summary": "...",
      "consequence": "...",
      "remedy": "Contact dealer",
      "dateNotified": "2021-08-01"
    }
  ],
  "maintenanceHistory": [
    {
      "id": "uuid",
      "serviceType": "oil_change",
      "serviceDate": "2024-01-05",
      "mileage": 44500,
      "cost": 75.00
    }
  ]
}
```

---

#### PUT /vehicles/{id}
Update vehicle information.

---

#### DELETE /vehicles/{id}
Remove vehicle from garage.

---

### 7.8 VIN Decoder Endpoints

#### POST /vin/decode
Decode a VIN and return comprehensive data.

**Request Body:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| vin | string | Yes | - |
| includeSafety | boolean | No | true |
| includeRecalls | boolean | No | true |
| includeMarketValue | boolean | No | false |

**Success Response (200):**
```json
{
  "vin": "1HGBH41JXMN109186",
  "valid": true,
  "checkDigitValid": true,
  "vehicle": {
    "year": 2021,
    "make": "Honda",
    "model": "Accord",
    "trim": "Sport 2.0T",
    "engine": {
      "displacement": "2.0L",
      "type": "Turbo I4",
      "horsepower": 252,
      "torque": 273,
      "fuelType": "Gasoline"
    },
    "transmission": {
      "type": "Automatic",
      "speeds": 10
    },
    "drivetrain": "FWD",
    "bodyType": "Sedan",
    "doors": 4,
    "manufacturerCountry": "United States",
    "plantCity": "Marysville",
    "plantState": "Ohio"
  },
  "safetyRatings": {
    "overall": 5,
    "frontalCrash": 5,
    "sideCrash": 5,
    "rollover": 4,
    "frontalCrashDriverRating": 5,
    "frontalCrashPassengerRating": 4,
    "sideCrashDriverRating": 5,
    "sideCrashPassengerRating": 5,
    "testYear": 2021
  },
  "recalls": [
    {
      "campaignNumber": "21V573",
      "reportDate": "2021-08-01",
      "component": "FUEL SYSTEM, GASOLINE",
      "summary": "The fuel pump may fail...",
      "consequence": "A fuel pump failure can cause...",
      "remedy": "Dealers will replace the fuel pump...",
      "notes": "Owners may contact Honda..."
    }
  ],
  "marketValue": {
    "tradeIn": { "low": 23000, "average": 24500, "high": 26000 },
    "privateParty": { "low": 25000, "average": 26800, "high": 28500 },
    "dealerRetail": { "low": 27000, "average": 28900, "high": 30500 },
    "estimatedAt": "2024-01-15",
    "mileageUsed": 45000,
    "condition": "Good"
  }
}
```

**Rate Limiting:**
- Free tier: Counts against monthly limit (5)
- Paid tiers: Unlimited

---

#### GET /vin/recalls/{vin}
Get only recall information for a VIN.

---

#### GET /vin/safety/{vin}
Get only safety ratings for a VIN.

---

#### POST /vin/batch
Batch decode multiple VINs (Dealer tier only).

**Request Body:**
```json
{
  "vins": ["VIN1", "VIN2", "VIN3"],
  "options": {
    "includeSafety": true,
    "includeRecalls": true
  }
}
```

Limit: 50 VINs per request.

---

### 7.9 Chat Endpoints

#### GET /chat/sessions
Get user's chat sessions.

**Query Parameters:**
| Field | Type | Default |
|-------|------|---------|
| vehicleId | string | null (all vehicles) |
| status | string | "active" |
| limit | number | 20 |
| offset | number | 0 |

---

#### POST /chat/sessions
Create a new chat session.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| sessionType | string | Yes |
| vehicleId | string | No |
| initialMessage | string | No |

**Session Types:** GENERAL, DIAGNOSTIC, REPAIR_GUIDE, PURCHASE_ADVICE, MAINTENANCE

---

#### GET /chat/sessions/{id}
Get session with message history.

---

#### POST /chat/sessions/{id}/messages
Send a message and receive AI response.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| content | string | Yes |
| attachments | array | No |

**Attachments format:**
```json
{
  "attachments": [
    {
      "type": "image",
      "data": "base64_encoded_image",
      "mimeType": "image/jpeg"
    }
  ]
}
```

**Response (SSE Stream):**
The response is a Server-Sent Events stream:

```
data: {"type": "start", "messageId": "uuid"}

data: {"type": "token", "content": "Based"}

data: {"type": "token", "content": " on"}

data: {"type": "function_call", "name": "check_recalls", "arguments": {"vin": "..."}}

data: {"type": "function_result", "name": "check_recalls", "result": {...}}

data: {"type": "token", "content": " your vehicle has"}

data: {"type": "done", "messageId": "uuid", "usage": {"promptTokens": 150, "completionTokens": 200}}
```

---

#### DELETE /chat/sessions/{id}
Delete a chat session.

---

### 7.10 Diagnostic Endpoints

#### POST /diagnostics/analyze
Analyze symptoms and get diagnosis.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| vehicleId | string | No |
| symptoms | array[string] | Yes |
| obdCodes | array[string] | No |
| images | array | No |

**Images format:**
```json
{
  "images": [
    {
      "data": "base64_encoded",
      "mimeType": "image/jpeg",
      "description": "Photo of brake rotor"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "sessionId": "uuid",
  "diagnosis": {
    "primaryIssue": "Worn brake pads causing grinding noise",
    "confidence": 0.87,
    "urgency": "high",
    "explanation": "The grinding noise during braking, combined with the vibration you're feeling, strongly suggests..."
  },
  "possibleCauses": [
    {
      "cause": "Worn brake pads",
      "likelihood": 0.9,
      "explanation": "When brake pads wear down to the metal..."
    },
    {
      "cause": "Warped brake rotors",
      "likelihood": 0.75,
      "explanation": "Warped rotors cause vibration..."
    }
  ],
  "recommendedRepairs": [
    {
      "repair": "Replace front brake pads and rotors",
      "estimatedCost": {
        "parts": { "low": 100, "high": 200 },
        "labor": { "low": 150, "high": 250 },
        "total": { "low": 250, "high": 450 }
      },
      "diyDifficulty": "moderate",
      "estimatedTime": "2-3 hours",
      "urgency": "high",
      "partsNeeded": [
        "Front brake pads",
        "Front brake rotors (pair)"
      ]
    }
  ],
  "imageAnalysis": [
    {
      "imageIndex": 0,
      "analysis": "The brake rotor shows visible scoring and uneven wear..."
    }
  ],
  "diyGuideAvailable": true,
  "diyGuidePreview": "To replace brake pads and rotors, you'll need..."
}
```

---

#### POST /diagnostics/image-analyze
Analyze a single image.

**Request Body (multipart/form-data):**
- image: Image file
- vehicleId: Optional vehicle ID
- description: User description of what's in the image

---

#### GET /diagnostics/sessions
Get user's diagnostic history.

---

#### GET /diagnostics/sessions/{id}
Get specific diagnostic session.

---

### 7.11 Repair Shop Endpoints

#### GET /shops/nearby
Find repair shops near a location.

**Query Parameters:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| latitude | number | Yes | - |
| longitude | number | Yes | - |
| radius | number | No | 10 (miles) |
| specialty | string | No | null |
| minRating | number | No | 0 |
| maxResults | number | No | 20 |
| sortBy | string | No | "distance" |

**Specialty options:** general, brakes, transmission, electrical, engine, bodywork, tires, oil_change

**Sort options:** distance, rating, reviews

**Success Response (200):**
```json
{
  "shops": [
    {
      "id": "uuid",
      "name": "AutoCare Plus",
      "address": "123 Main St",
      "city": "Minneapolis",
      "state": "MN",
      "zipCode": "55401",
      "distance": 2.3,
      "distanceUnit": "miles",
      "rating": 4.7,
      "reviewCount": 234,
      "priceLevel": 2,
      "phone": "(612) 555-1234",
      "website": "https://autocareplus.com",
      "isOpen": true,
      "closesAt": "18:00",
      "specialties": ["brakes", "transmission"],
      "certifications": ["ASE Certified", "AAA Approved"],
      "isPartner": true
    }
  ],
  "count": 15,
  "nextPage": "/shops/nearby?...&offset=20"
}
```

---

#### GET /shops/{id}
Get detailed shop information.

---

#### POST /shops/{id}/contact
Submit contact inquiry to shop.

---

### 7.12 Maintenance Endpoints

#### GET /maintenance/records
Get all maintenance records.

**Query Parameters:**
| Field | Type |
|-------|------|
| vehicleId | string |
| startDate | string (ISO) |
| endDate | string (ISO) |

---

#### POST /maintenance/records
Add maintenance record.

---

#### PUT /maintenance/records/{id}
Update maintenance record.

---

#### DELETE /maintenance/records/{id}
Delete maintenance record.

---

#### GET /maintenance/schedule/{vehicleId}
Get recommended maintenance schedule for a vehicle.

Returns list of upcoming maintenance based on vehicle age, mileage, and manufacturer recommendations.

---

### 7.13 Subscription Endpoints

#### GET /subscription
Get current subscription status.

---

#### POST /subscription/checkout
Create Stripe checkout session.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| tier | string | Yes |
| billingPeriod | string | No |

**Tiers:** PRO, FAMILY, DEALER
**Billing:** monthly, yearly (20% discount)

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_xxx"
}
```

---

#### POST /subscription/portal
Create Stripe customer portal session.

Returns URL for customer to manage their subscription (cancel, update payment, view invoices).

---

#### POST /webhooks/stripe
Stripe webhook handler.

Handles events:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update tier/status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_succeeded` - Reset usage counters
- `invoice.payment_failed` - Mark as past_due

---

## 8. OpenAI GPT-5.2 Integration

### 8.1 Model Selection

**Model:** `gpt-5.2`

GPT-5.2 is the latest flagship model from OpenAI (as of January 2026), offering:
- Enhanced reasoning capabilities
- Improved factual accuracy
- Native vision for image analysis
- Function calling for tool use
- Streaming responses for real-time chat
- Context compaction for long conversations

### 8.2 API Configuration

**Endpoint:** `https://api.openai.com/v1/responses`

This is the newer Responses API (not the legacy Chat Completions API). It offers:
- Simpler request/response format
- Built-in function calling
- Streaming via SSE
- Context management with `/responses/compact`

### 8.3 System Prompts

#### 8.3.1 General Automotive Assistant

```
You are MyAutoWhiz, an expert automotive AI assistant with comprehensive knowledge of vehicle mechanics, diagnostics, repair procedures, and the automotive industry.

## Your Expertise
- Vehicle systems: engine, transmission, brakes, suspension, electrical, HVAC, exhaust
- Diagnostic procedures and OBD-II trouble code interpretation
- Repair procedures from basic maintenance to complex repairs
- Parts identification and compatibility
- Cost estimation for repairs
- Safety considerations and when professional help is needed

## Your Personality
- Friendly and approachable, like talking to a knowledgeable friend
- Patient and willing to explain concepts simply
- Safety-conscious - always emphasize safety when relevant
- Honest about limitations - recommend professionals when appropriate

## Guidelines
1. When discussing repairs, always consider user's skill level
2. For safety-critical systems (brakes, steering, airbags), recommend professional service
3. Provide cost estimates as ranges, not exact figures
4. When uncertain, say so rather than guessing
5. Use the available tools to look up specific vehicle information

## Current Context
{vehicle_context}
```

#### 8.3.2 Diagnostic Mode System Prompt

```
You are MyAutoWhiz in diagnostic mode. Your goal is to help identify vehicle problems based on symptoms, codes, and images.

## Diagnostic Process
1. Gather Information
   - Ask about specific symptoms (when, where, what conditions)
   - Request any OBD codes if user has them
   - Ask about recent maintenance or repairs
   - Request photos if relevant

2. Analyze
   - Consider the specific vehicle (year, make, model, mileage)
   - Identify likely causes ranked by probability
   - Consider common issues for this vehicle

3. Recommend
   - Provide likely diagnosis with confidence level
   - Explain the reasoning
   - Suggest next steps (DIY vs professional)
   - Estimate repair costs

## Using Tools
- Use check_recalls() to see if issue might be recall-related
- Use estimate_repair_cost() to provide accurate cost estimates
- Use lookup_dtc_code() to explain diagnostic trouble codes

## Safety Priority
Always recommend professional inspection for:
- Brake system issues
- Steering problems
- Airbag/SRS warnings
- Suspension concerns
- Any issue affecting vehicle control

Current Vehicle: {vehicle_context}
```

#### 8.3.3 Repair Guide Mode System Prompt

```
You are MyAutoWhiz in repair guide mode. Your goal is to provide step-by-step repair instructions.

## Providing Repair Guidance
1. Assess the Repair
   - Confirm the specific repair needed
   - Evaluate if DIY-appropriate for average skill level
   - List required tools and parts

2. Provide Instructions
   - Clear, numbered steps
   - Include torque specifications where relevant
   - Note common mistakes to avoid
   - Suggest when to take photos for reference

3. Safety Emphasis
   - Always include safety warnings
   - Specify required safety equipment
   - Note when to stop and seek professional help

## Format
- Use clear headers for sections
- Number all steps
- Use bullet points for sub-steps
- Include estimated time per section
- Note parts that may need replacement during the repair

Current Vehicle: {vehicle_context}
```

### 8.4 Function Tools

The AI can call these functions to retrieve real-time data:

#### 8.4.1 lookup_vehicle_info

**Description:** Decode VIN and retrieve comprehensive vehicle specifications

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| vin | string | Yes | 17-character VIN |

**Implementation:**
1. Validate VIN format
2. Call NHTSA vPIC API
3. Return structured vehicle data

---

#### 8.4.2 check_recalls

**Description:** Check for active recalls on a vehicle

**Parameters:**
| Name | Type | Required |
|------|------|----------|
| vin | string | No |
| year | integer | No |
| make | string | No |
| model | string | No |

At least VIN or (year + make + model) required.

**Implementation:**
1. Call NHTSA Recalls API
2. Filter to open/uncompleted recalls
3. Return list with campaign numbers and summaries

---

#### 8.4.3 estimate_repair_cost

**Description:** Estimate labor and parts cost for a specific repair

**Parameters:**
| Name | Type | Required |
|------|------|----------|
| repairType | string | Yes |
| vehicleYear | integer | Yes |
| vehicleMake | string | Yes |
| vehicleModel | string | Yes |
| locationZip | string | No |

**Implementation:**
1. Look up repair in internal database of average costs
2. Adjust for vehicle make/model (luxury vehicles cost more)
3. Adjust for regional labor rates if zip provided
4. Return range: {parts: {low, high}, labor: {low, high}}

---

#### 8.4.4 find_nearby_shops

**Description:** Find repair shops near a location

**Parameters:**
| Name | Type | Required |
|------|------|----------|
| latitude | number | Yes |
| longitude | number | Yes |
| specialty | string | No |
| radiusMiles | integer | No (default 10) |

**Implementation:**
1. Call Google Places API with type "car_repair"
2. Filter by specialty if provided
3. Sort by rating
4. Return top 5 shops with name, rating, distance, phone

---

#### 8.4.5 lookup_dtc_code

**Description:** Look up OBD-II diagnostic trouble code meaning

**Parameters:**
| Name | Type | Required |
|------|------|----------|
| code | string | Yes |
| vehicleMake | string | No |

**Implementation:**
1. Parse code format (P0xxx, B0xxx, C0xxx, U0xxx)
2. Look up in DTC database
3. If vehicle make provided, check for manufacturer-specific meaning
4. Return description, common causes, and typical repairs

---

#### 8.4.6 get_maintenance_schedule

**Description:** Get manufacturer-recommended maintenance for a vehicle

**Parameters:**
| Name | Type | Required |
|------|------|----------|
| vehicleYear | integer | Yes |
| vehicleMake | string | Yes |
| vehicleModel | string | Yes |
| currentMileage | integer | Yes |

**Implementation:**
1. Look up maintenance schedule for vehicle
2. Calculate upcoming maintenance based on mileage
3. Return list of upcoming services with mileage intervals

---

### 8.5 Streaming Implementation

Chat responses are streamed using Server-Sent Events:

**Server Implementation:**
1. Set response headers for SSE
2. Create OpenAI request with `stream: true`
3. For each chunk from OpenAI:
   - If text token: send `data: {"type": "token", "content": "..."}`
   - If function call start: send `data: {"type": "function_call", "name": "..."}`
   - Execute function server-side
   - Send function result: `data: {"type": "function_result", ...}`
   - Resume streaming AI response
4. On completion: send `data: {"type": "done", ...}`
5. Close connection

**Client Implementation (Web):**
1. Create EventSource or use fetch with ReadableStream
2. Parse each SSE `data:` line
3. Append tokens to message display as they arrive
4. Show function execution indicator when function called
5. Update UI on completion

**Client Implementation (iOS):**
1. Use URLSession with delegate for streaming
2. Parse SSE format manually
3. Update SwiftUI view with each token
4. Handle function call indicators

### 8.6 Context Management

For long conversations, use context compaction:

1. After 20 messages, call `/responses/compact` endpoint
2. Compaction summarizes earlier messages while preserving key information
3. Store compacted context in chat session
4. Use compacted context + recent messages for new requests

### 8.7 Image Analysis

GPT-5.2 Vision is used for analyzing user-uploaded images:

**Supported Analyses:**
- Tire tread depth and wear patterns
- Brake pad/rotor condition
- Fluid leaks (color and location identification)
- Rust and corrosion assessment
- Dashboard warning lights
- Body damage assessment
- Part identification

**Image Requirements:**
- Formats: JPEG, PNG, WebP, GIF
- Max size: 20MB
- Recommended resolution: 1024x1024 minimum for detail
- Good lighting for accurate analysis

**Request Format:**
Images are sent as base64-encoded data in the message content:

```json
{
  "model": "gpt-5.2",
  "input": [
    {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/jpeg",
        "data": "<base64_encoded_image>"
      }
    },
    {
      "type": "text",
      "text": "What is wrong with this brake rotor?"
    }
  ]
}
```

### 8.8 Cost Management

**Token Pricing (GPT-5.2 as of Jan 2026):**
- Input tokens: ~$5 per 1M tokens
- Output tokens: ~$15 per 1M tokens

**Cost Optimization Strategies:**
1. Cache common responses (DTC codes, maintenance schedules)
2. Use function results instead of re-explaining
3. Compact long conversations
4. Set reasonable max_tokens (1500 for most responses)
5. Use system prompts efficiently (not too verbose)

**Estimated Costs per User Tier:**
| Tier | Avg Messages/Month | Avg Tokens/Message | Est. Cost/User |
|------|-------------------|-------------------|----------------|
| Free | 20 | 500 | $0.50 |
| Pro | 1000 | 600 | $3.00 |
| Family | 2000 | 600 | $5.00 |
| Dealer | 5000 | 700 | $15.00 |

---

## 9. External API Integrations

### 9.1 NHTSA vPIC API (VIN Decoding)

**Base URL:** `https://vpic.nhtsa.dot.gov/api/`

**Cost:** Free (government API)

**Rate Limits:** Not officially specified; implement 10 req/sec limit

**Primary Endpoints:**

#### DecodeVinValues
Decode a VIN and get flat key-value pairs.

**URL:** `GET /vehicles/DecodeVinValues/{vin}?format=json`

**Response Fields Used:**
- Make, Model, ModelYear
- VehicleType, BodyClass
- EngineCylinders, EngineHP, DisplacementL
- TransmissionStyle, TransmissionSpeeds
- DriveType
- FuelTypePrimary
- PlantCountry, PlantCity, PlantState
- ErrorCode (check for decode errors)

#### DecodeVinValuesBatch
Decode multiple VINs in one request.

**URL:** `POST /vehicles/DecodeVinValuesBatch/`

**Body:** `DATA=vin1;vin2;vin3&format=json`

**Limit:** 50 VINs per request

### 9.2 NHTSA Safety Ratings API

**Base URL:** `https://api.nhtsa.gov/SafetyRatings/`

**Cost:** Free

**Primary Endpoints:**

#### Get Vehicle Variants
**URL:** `GET /modelyear/{year}/make/{make}/model/{model}?format=json`

Returns list of variants with VehicleId.

#### Get Safety Ratings
**URL:** `GET /VehicleId/{vehicleId}?format=json`

**Response Fields:**
- OverallRating (1-5 stars)
- OverallFrontCrashRating
- OverallSideCrashRating
- RolloverRating
- FrontCrashDriversideRating
- FrontCrashPassengersideRating
- SideCrashDriversideRating
- SideCrashPassengersideRating

### 9.3 NHTSA Recalls API

**Base URL:** `https://api.nhtsa.gov/recalls/`

**Cost:** Free

**Primary Endpoints:**

#### Recalls by Vehicle
**URL:** `GET /recallsByVehicle?make={make}&model={model}&modelYear={year}`

**Response Fields:**
- NHTSACampaignNumber
- ReportReceivedDate
- Component
- Summary
- Consequence
- Remedy
- Notes
- Manufacturer

### 9.4 Google Places API (New)

**Base URL:** `https://places.googleapis.com/v1/`

**Cost:** 
- Nearby Search (Basic): $25 per 1000 requests
- Place Details (Basic): $17 per 1000 requests

**Implementation:**

#### Nearby Search
**URL:** `POST /places:searchNearby`

**Request Body:**
```json
{
  "includedTypes": ["car_repair"],
  "maxResultCount": 20,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 45.0,
        "longitude": -93.0
      },
      "radius": 16093.4
    }
  }
}
```

**Headers:**
- `X-Goog-Api-Key: YOUR_API_KEY`
- `X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,...`

Use field masking to reduce costs by requesting only needed fields.

#### Place Details
**URL:** `GET /places/{placeId}`

Get detailed information including reviews, hours, photos.

### 9.5 Stripe API

**Base URL:** `https://api.stripe.com/v1/`

**Cost:** 2.9% + $0.30 per transaction

**Key Integrations:**

#### Checkout Sessions
Create hosted checkout page for subscription signup.

#### Customer Portal
Allow customers to manage subscriptions, payment methods, invoices.

#### Webhooks
Listen for subscription lifecycle events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 9.6 Resend (Email)

**Base URL:** `https://api.resend.com/`

**Cost:** Free tier: 3000 emails/month

**Email Types:**
- Welcome email on registration
- Email verification
- Password reset
- Subscription confirmation
- Recall alerts
- Maintenance reminders
- Weekly digest (opt-in)

### 9.7 Apple Push Notification service

**Cost:** Free

**Notification Types:**
- New recall detected for user's vehicle
- Maintenance reminder (oil change due at X miles)
- Subscription expiring
- Promotional (new features, limited)

**Implementation:**
- Obtain APNs certificate from Apple Developer Portal
- Store device tokens in database
- Use `apn` npm package for sending

---

## 10. Web Application

### 10.1 Framework: Next.js 15 with App Router

The web application uses Next.js 15's App Router for:
- Server Components (reduce client JS)
- Server Actions (form submissions)
- Streaming (loading states)
- Parallel and intercepting routes

### 10.2 Styling: Tailwind CSS 4 + shadcn/ui

**Tailwind 4** provides:
- Lightning CSS compiler (faster builds)
- Native CSS nesting
- Container queries

**shadcn/ui** provides:
- Accessible, customizable components
- Radix UI primitives
- Copy-paste components (not a dependency)

### 10.3 Page Structure

```
app/
├── (marketing)/              # Public marketing pages
│   ├── layout.tsx            # Marketing layout (header, footer)
│   ├── page.tsx              # Landing page (/)
│   ├── pricing/page.tsx      # Pricing page
│   ├── features/page.tsx     # Features breakdown
│   ├── about/page.tsx        # About us
│   └── blog/
│       ├── page.tsx          # Blog listing
│       └── [slug]/page.tsx   # Individual blog post
│
├── (auth)/                   # Authentication pages
│   ├── layout.tsx            # Minimal auth layout
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Registration page
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── verify-email/page.tsx
│
├── (dashboard)/              # Authenticated app
│   ├── layout.tsx            # Dashboard layout (sidebar, header)
│   ├── dashboard/page.tsx    # Overview dashboard
│   ├── garage/
│   │   ├── page.tsx          # Vehicle list
│   │   ├── add/page.tsx      # Add vehicle
│   │   └── [id]/page.tsx     # Vehicle details
│   ├── chat/
│   │   ├── page.tsx          # Chat list / new chat
│   │   └── [sessionId]/page.tsx  # Chat session
│   ├── diagnose/
│   │   ├── page.tsx          # New diagnostic
│   │   └── [id]/page.tsx     # Diagnostic results
│   ├── shops/
│   │   ├── page.tsx          # Shop finder
│   │   └── [id]/page.tsx     # Shop details
│   ├── maintenance/page.tsx  # Maintenance history
│   └── settings/
│       ├── page.tsx          # Profile settings
│       ├── billing/page.tsx  # Subscription management
│       └── notifications/page.tsx
│
├── api/                      # API routes (if any client-side)
├── globals.css               # Global styles
├── layout.tsx                # Root layout
└── not-found.tsx             # 404 page
```

### 10.4 Component Organization

```
components/
├── ui/                       # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── toast.tsx
│   └── ... (all shadcn components)
│
├── layout/
│   ├── Header.tsx            # Marketing header
│   ├── DashboardHeader.tsx   # Dashboard header with user menu
│   ├── Sidebar.tsx           # Dashboard sidebar navigation
│   ├── Footer.tsx            # Marketing footer
│   └── MobileNav.tsx         # Mobile navigation
│
├── auth/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── OAuthButtons.tsx      # Google, Apple, Facebook buttons
│   └── AuthGuard.tsx         # Protect routes
│
├── vehicles/
│   ├── VehicleCard.tsx       # Vehicle card in garage
│   ├── VehicleDetails.tsx    # Full vehicle details
│   ├── VINInput.tsx          # VIN input with validation
│   ├── AddVehicleForm.tsx    # Add vehicle form
│   ├── RecallBadge.tsx       # Recall warning badge
│   └── SafetyRatings.tsx     # Star rating display
│
├── chat/
│   ├── ChatInterface.tsx     # Main chat UI
│   ├── MessageList.tsx       # Scrollable message list
│   ├── MessageBubble.tsx     # Individual message
│   ├── ChatInput.tsx         # Input with attachments
│   ├── StreamingMessage.tsx  # Message with typing animation
│   ├── FunctionCallIndicator.tsx  # "Looking up..."
│   └── SessionList.tsx       # Chat history sidebar
│
├── diagnostic/
│   ├── SymptomSelector.tsx   # Multi-select symptoms
│   ├── CodeInput.tsx         # OBD code input
│   ├── ImageUpload.tsx       # Photo upload
│   ├── DiagnosisResult.tsx   # Diagnosis display
│   ├── RepairEstimate.tsx    # Cost breakdown
│   └── UrgencyBadge.tsx      # Urgency indicator
│
├── shops/
│   ├── ShopMap.tsx           # Mapbox map with pins
│   ├── ShopList.tsx          # List view
│   ├── ShopCard.tsx          # Individual shop
│   ├── ShopDetails.tsx       # Full shop info
│   ├── ShopFilters.tsx       # Filter controls
│   └── ContactForm.tsx       # Shop inquiry form
│
├── maintenance/
│   ├── MaintenanceTimeline.tsx
│   ├── RecordCard.tsx
│   ├── AddRecordForm.tsx
│   └── ScheduleList.tsx
│
├── subscription/
│   ├── PricingTable.tsx      # Tier comparison
│   ├── UpgradeModal.tsx      # Upgrade prompt
│   ├── UsageDisplay.tsx      # Usage meters
│   └── BillingHistory.tsx    # Invoice list
│
└── shared/
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    ├── EmptyState.tsx
    ├── ConfirmDialog.tsx
    ├── SearchInput.tsx
    └── Pagination.tsx
```

### 10.5 State Management

**Zustand** for global state:

```
stores/
├── authStore.ts              # User auth state
├── vehicleStore.ts           # Selected vehicle, garage
├── chatStore.ts              # Current chat session
└── uiStore.ts                # Sidebar state, modals
```

**Tanstack Query** for server state:

```
hooks/
├── useUser.ts                # GET /user/profile
├── useVehicles.ts            # GET /vehicles
├── useVehicle.ts             # GET /vehicles/{id}
├── useChatSessions.ts        # GET /chat/sessions
├── useDiagnostics.ts         # GET /diagnostics/sessions
├── useShops.ts               # GET /shops/nearby
├── useSubscription.ts        # GET /subscription
└── useMutation hooks for POST/PUT/DELETE
```

### 10.6 Key User Flows

#### Landing Page → Signup → First VIN Lookup

1. **Landing Page**
   - Hero section with value proposition
   - Feature highlights with icons
   - Testimonials
   - Pricing preview
   - CTA: "Get Started Free"

2. **Signup Page**
   - OAuth buttons (Google, Apple) at top
   - Divider "or continue with email"
   - Email/password form
   - Terms acceptance checkbox
   - Submit → Create account → Auto-login

3. **Onboarding Modal**
   - "Add your first vehicle"
   - VIN input with camera scan option (on mobile)
   - "Skip for now" option

4. **Dashboard**
   - If no vehicles: Empty state with "Add Vehicle" CTA
   - If vehicles: Vehicle cards with quick actions

5. **Add Vehicle**
   - VIN input with validation
   - "Decode" button
   - Show decoded data preview
   - Confirm and save

#### Chat Diagnostic Flow

1. **Start New Chat**
   - Select vehicle (optional)
   - Choose session type: "Diagnose a Problem"
   - Initial prompt: "What issue are you experiencing?"

2. **User Describes Problem**
   - Text input with optional image attachment
   - Send message

3. **AI Responds**
   - Streaming response with typing indicator
   - May ask clarifying questions
   - May call functions (show indicator)

4. **Continue Conversation**
   - User provides more details
   - AI narrows down diagnosis
   - Eventually provides diagnosis with confidence

5. **View Recommendations**
   - Suggested repairs with cost estimates
   - DIY guide availability
   - "Find a Shop" button

6. **Find Shop (optional)**
   - Opens shop finder with specialty pre-selected
   - Map view with shops
   - Select shop for details

### 10.7 SEO Optimization

**Strategies:**
1. **Server-Side Rendering** - All marketing pages pre-rendered
2. **Metadata API** - Dynamic meta tags per page
3. **Sitemap** - Auto-generated sitemap.xml
4. **Blog** - SEO content (e.g., "How to Check Brake Pads")
5. **Structured Data** - JSON-LD for articles, FAQ
6. **Open Graph** - Social sharing images

**Free VIN Decoder Page:**
- Public page at `/vin-decoder`
- Allows one free lookup without signup
- Captures email for lead generation
- Upsell to create account for more lookups

---

## 11. iOS Application

### 11.1 Project Setup

**Minimum Deployment:** iOS 17.0
**Devices:** iPhone and iPad (Universal)
**Architecture:** MVVM with Coordinators
**Language:** Swift 5.9+
**UI Framework:** SwiftUI

### 11.2 App Structure

```
MyAutoWhiz/
├── App/
│   ├── MyAutoWhizApp.swift       # App entry point
│   ├── AppDelegate.swift         # Push notifications, lifecycle
│   ├── SceneDelegate.swift       # Scene management
│   └── AppCoordinator.swift      # Root navigation
│
├── Features/
│   ├── Auth/
│   │   ├── Views/
│   │   │   ├── LoginView.swift
│   │   │   ├── SignupView.swift
│   │   │   └── ForgotPasswordView.swift
│   │   ├── ViewModels/
│   │   │   └── AuthViewModel.swift
│   │   └── Coordinator/
│   │       └── AuthCoordinator.swift
│   │
│   ├── Garage/
│   │   ├── Views/
│   │   │   ├── GarageView.swift
│   │   │   ├── VehicleDetailView.swift
│   │   │   ├── AddVehicleView.swift
│   │   │   └── VINScannerView.swift
│   │   ├── ViewModels/
│   │   │   ├── GarageViewModel.swift
│   │   │   └── VehicleDetailViewModel.swift
│   │   └── Components/
│   │       ├── VehicleCard.swift
│   │       └── RecallAlert.swift
│   │
│   ├── Chat/
│   │   ├── Views/
│   │   │   ├── ChatListView.swift
│   │   │   ├── ChatView.swift
│   │   │   └── NewChatView.swift
│   │   ├── ViewModels/
│   │   │   ├── ChatListViewModel.swift
│   │   │   └── ChatViewModel.swift
│   │   └── Components/
│   │       ├── MessageBubble.swift
│   │       ├── ChatInputBar.swift
│   │       ├── StreamingText.swift
│   │       └── ImageAttachmentPicker.swift
│   │
│   ├── Diagnose/
│   │   ├── Views/
│   │   │   ├── DiagnoseView.swift
│   │   │   ├── SymptomPickerView.swift
│   │   │   └── DiagnosisResultView.swift
│   │   ├── ViewModels/
│   │   │   └── DiagnoseViewModel.swift
│   │   └── Components/
│   │       ├── SymptomChip.swift
│   │       ├── CodeInputField.swift
│   │       └── CostEstimateCard.swift
│   │
│   ├── Shops/
│   │   ├── Views/
│   │   │   ├── ShopFinderView.swift
│   │   │   ├── ShopMapView.swift
│   │   │   └── ShopDetailView.swift
│   │   ├── ViewModels/
│   │   │   └── ShopFinderViewModel.swift
│   │   └── Components/
│   │       ├── ShopCard.swift
│   │       └── ShopAnnotation.swift
│   │
│   ├── Profile/
│   │   ├── Views/
│   │   │   ├── ProfileView.swift
│   │   │   ├── SettingsView.swift
│   │   │   └── SubscriptionView.swift
│   │   └── ViewModels/
│   │       └── ProfileViewModel.swift
│   │
│   └── Onboarding/
│       ├── Views/
│       │   └── OnboardingView.swift
│       └── ViewModels/
│           └── OnboardingViewModel.swift
│
├── Core/
│   ├── Networking/
│   │   ├── APIClient.swift           # Base HTTP client
│   │   ├── Endpoints.swift           # API endpoint definitions
│   │   ├── AuthInterceptor.swift     # Token management
│   │   └── SSEClient.swift           # Server-Sent Events
│   │
│   ├── Services/
│   │   ├── AuthService.swift
│   │   ├── VehicleService.swift
│   │   ├── ChatService.swift
│   │   ├── DiagnosticService.swift
│   │   ├── ShopService.swift
│   │   └── SubscriptionService.swift
│   │
│   ├── Models/
│   │   ├── User.swift
│   │   ├── Vehicle.swift
│   │   ├── ChatSession.swift
│   │   ├── ChatMessage.swift
│   │   ├── DiagnosticSession.swift
│   │   ├── RepairShop.swift
│   │   └── Subscription.swift
│   │
│   ├── Storage/
│   │   ├── KeychainManager.swift     # Secure token storage
│   │   ├── UserDefaultsManager.swift # Preferences
│   │   └── CacheManager.swift        # Response caching
│   │
│   └── Utilities/
│       ├── Extensions/
│       │   ├── Date+Extensions.swift
│       │   ├── String+Extensions.swift
│       │   └── View+Extensions.swift
│       ├── Validators.swift
│       └── Constants.swift
│
├── UI/
│   ├── Components/
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   ├── EmptyStateView.swift
│   │   ├── StarRating.swift
│   │   ├── PrimaryButton.swift
│   │   └── SecondaryButton.swift
│   │
│   ├── Theme/
│   │   ├── Colors.swift
│   │   ├── Typography.swift
│   │   └── Spacing.swift
│   │
│   └── TabBar/
│       └── MainTabView.swift
│
└── Resources/
    ├── Assets.xcassets
    ├── LaunchScreen.storyboard
    ├── Localizable.strings
    └── Info.plist
```

### 11.3 Main Tab Navigation

The app uses a 5-tab structure:

| Tab | Icon | View | Description |
|-----|------|------|-------------|
| Garage | car.fill | GarageView | Vehicle list and management |
| Chat | message.fill | ChatListView | AI assistant conversations |
| Diagnose | wrench.and.screwdriver.fill | DiagnoseView | Diagnostic tool |
| Shops | mappin.circle.fill | ShopFinderView | Repair shop finder |
| Profile | person.circle.fill | ProfileView | Settings and subscription |

### 11.4 Key Feature Implementations

#### 11.4.1 VIN Scanner

Use VisionKit's DataScannerViewController to scan VIN barcodes and text:

**Capabilities:**
- Scan VIN from barcode (Code 39, Code 128)
- Scan VIN from text (OCR)
- Camera overlay with VIN location hint
- Manual entry fallback

**Flow:**
1. User taps "Scan VIN"
2. Present DataScannerViewController
3. Recognize barcode or text matching VIN pattern
4. Vibrate on successful scan
5. Return VIN to AddVehicleView
6. Auto-trigger decode

#### 11.4.2 Streaming Chat

Implement SSE client for streaming AI responses:

**Implementation:**
1. Create URLSession with delegate
2. Start request to `/chat/sessions/{id}/messages`
3. Receive SSE events as data comes in
4. Parse each `data:` line
5. Update UI with each token
6. Show function call indicator when needed
7. Complete on `{"type": "done"}`

**UI Behavior:**
- Show typing indicator while waiting
- Append tokens to message text as received
- Smooth scroll to bottom
- Show timestamp on completion

#### 11.4.3 Image Attachment

For diagnostic photos:

**Flow:**
1. User taps attachment button in chat
2. Show ActionSheet: Camera / Photo Library
3. Present ImagePicker
4. Compress image to max 1MB
5. Show thumbnail preview
6. Send with message as base64

**Compression:**
- Resize to max 1024px on longest edge
- JPEG compression at 0.7 quality
- Target under 1MB for fast upload

#### 11.4.4 Push Notifications

**Notification Types:**
- Recall Alert: "New recall for your 2021 Honda Accord"
- Maintenance Reminder: "Oil change due in 500 miles"
- Subscription: "Your subscription renews in 3 days"

**Implementation:**
1. Request notification permission on first launch
2. Register for remote notifications
3. Send device token to backend
4. Handle notification tap to deep link

#### 11.4.5 Sign in with Apple

Required for App Store compliance when offering social login:

**Implementation:**
1. Configure in Apple Developer Portal
2. Add Sign in with Apple capability
3. Use ASAuthorizationController
4. Send identity token to backend
5. Backend verifies with Apple and creates/updates user

### 11.5 Offline Support

**Cached Data:**
- User profile
- Vehicle list and details
- Recent chat sessions (last 10)
- Favorite repair shops

**Offline Behavior:**
- Show cached data with "offline" banner
- Queue actions for sync when online
- Disable features requiring API (new chat, VIN decode)

### 11.6 App Store Requirements Checklist

| Requirement | Implementation |
|-------------|----------------|
| Privacy Policy | Link in Settings and App Store listing |
| Terms of Service | Link in Settings |
| Sign in with Apple | Required if social login offered |
| In-App Purchases | StoreKit 2 for subscriptions |
| Location Permission | "When in Use" for shop finder |
| Camera Permission | VIN scanning, diagnostic photos |
| Push Notifications | Recall alerts, reminders |
| App Tracking Transparency | If using analytics with IDFA |

---

## 12. Real-Time Features

### 12.1 Server-Sent Events (SSE)

Used for streaming AI chat responses.

**Why SSE over WebSocket:**
- Simpler implementation
- Works through HTTP proxies
- Auto-reconnection built-in
- Sufficient for server→client streaming

**Implementation:**
- Express route with `text/event-stream` content type
- Send data in format: `data: {json}\n\n`
- Client uses EventSource (web) or URLSession (iOS)

### 12.2 WebSocket (Optional Future)

If real-time bidirectional communication needed:
- Live typing indicators
- Collaborative features
- Real-time notifications

### 12.3 Polling Fallback

For environments where SSE fails:
- Poll every 500ms during active chat
- Stop polling on completion
- Combine with long-polling for efficiency

---

## 13. Payment & Subscription System

### 13.1 Stripe Integration

**Products & Prices:**

Create in Stripe Dashboard:
- Product: "MyAutoWhiz Pro" with monthly and yearly prices
- Product: "MyAutoWhiz Family" with monthly and yearly prices
- Product: "MyAutoWhiz Dealer" with monthly and yearly prices

**Price IDs:**
```
PRO_MONTHLY: price_xxx
PRO_YEARLY: price_xxx (20% discount)
FAMILY_MONTHLY: price_xxx
FAMILY_YEARLY: price_xxx
DEALER_MONTHLY: price_xxx
DEALER_YEARLY: price_xxx
```

### 13.2 Checkout Flow (Web)

1. User clicks "Upgrade to Pro"
2. Frontend calls `POST /subscription/checkout` with tier
3. Backend creates Stripe Checkout Session
4. Backend returns checkout URL
5. Frontend redirects to Stripe Checkout
6. User completes payment
7. Stripe redirects to success URL
8. Webhook receives `checkout.session.completed`
9. Backend updates user subscription

### 13.3 Checkout Flow (iOS)

1. User selects tier in app
2. App fetches products from StoreKit
3. User confirms purchase
4. StoreKit handles payment with Apple
5. App receives transaction
6. App sends receipt to backend for validation
7. Backend verifies with Apple
8. Backend updates user subscription

### 13.4 Subscription Management

**Customer Portal:**
- Allow users to update payment method
- View invoice history
- Cancel or change subscription
- Resume canceled subscription

### 13.5 Webhook Handling

**Critical Webhooks:**

| Event | Action |
|-------|--------|
| checkout.session.completed | Create/update subscription |
| customer.subscription.updated | Update tier and status |
| customer.subscription.deleted | Mark as canceled |
| invoice.payment_succeeded | Reset monthly usage counters |
| invoice.payment_failed | Mark as past_due, send email |
| customer.subscription.trial_will_end | Send trial ending reminder |

### 13.6 Grace Periods

- **Trial:** 7 days free trial for Pro tier
- **Past Due:** 7 days grace period before downgrade
- **Canceled:** Access until end of billing period

---

## 14. Background Jobs & Scheduling

### 14.1 Job Queue: BullMQ

Use BullMQ with Redis for reliable background processing.

### 14.2 Job Types

#### Recall Check Job
- **Schedule:** Daily at 2 AM UTC
- **Action:** Check NHTSA for new recalls for all stored vehicles
- **On New Recall:** Send push notification and email to owner

#### Usage Reset Job
- **Schedule:** First of each month at 12 AM UTC
- **Action:** Reset monthly usage counters for free tier users

#### Cache Cleanup Job
- **Schedule:** Hourly
- **Action:** Remove expired cache entries from Redis

#### Email Digest Job
- **Schedule:** Weekly on Sunday at 9 AM local time
- **Action:** Send weekly digest email with vehicle status, upcoming maintenance

#### Subscription Expiry Check
- **Schedule:** Daily at 6 AM UTC
- **Action:** Identify subscriptions ending in 3 days, send reminder

### 14.3 Job Processing

**Worker Configuration:**
- Concurrency: 5 jobs per queue
- Retry: 3 attempts with exponential backoff
- Dead letter queue for failed jobs
- Logging for all job completions and failures

---

## 15. Railway Deployment

### 15.1 Service Configuration

**Project Structure in Railway:**

```
MyAutoWhiz (Project)
├── web (Service)
│   ├── Source: apps/web
│   ├── Builder: Nixpacks
│   ├── Start: npm run start
│   ├── Port: 3000
│   └── Replicas: 2
│
├── api (Service)
│   ├── Source: apps/api
│   ├── Builder: Nixpacks
│   ├── Start: npm run start
│   ├── Port: 4000
│   └── Replicas: 3
│
├── worker (Service)
│   ├── Source: apps/worker
│   ├── Builder: Nixpacks
│   ├── Start: npm run start
│   └── Replicas: 1
│
├── postgres (Database)
│   ├── Plan: Starter
│   ├── Storage: 10GB
│   └── RAM: 1GB
│
└── redis (Database)
    ├── Plan: Starter
    └── RAM: 256MB
```

### 15.2 Environment Variables

**Shared Variables (Service Variables in Railway):**
```
DATABASE_URL=postgresql://user:pass@host:5432/myautowhiz
REDIS_URL=redis://default:pass@host:6379

# External Services
OPENAI_API_KEY=sk-xxx
GOOGLE_PLACES_API_KEY=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx

# Auth
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_TEAM_ID=xxx
APPLE_KEY_ID=xxx

# URLs
WEB_URL=https://myautowhiz.com
API_URL=https://api.myautowhiz.com

# Environment
NODE_ENV=production
```

### 15.3 Domain Configuration

**In Railway:**
1. Add custom domain `api.myautowhiz.com` to api service
2. Add custom domain `myautowhiz.com` to web service

**In Cloudflare:**
1. Add CNAME record: `api` → `[railway-domain].up.railway.app`
2. Add CNAME record: `@` → `[railway-domain].up.railway.app`
3. Set SSL mode to "Full (strict)"
4. Enable "Always Use HTTPS"

### 15.4 Deployment Pipeline

**GitHub Actions workflow:**

1. **On Push to `main`:**
   - Run tests
   - Build applications
   - Deploy to Railway (auto-detected by Railway GitHub integration)

2. **On Pull Request:**
   - Run tests
   - Preview deployment (optional)

### 15.5 Database Migrations

**Strategy:**
1. Migrations run automatically on API service start
2. Use Prisma Migrate for schema changes
3. Always test migrations in staging first
4. Keep migrations backward compatible

---

## 16. Security Implementation

### 16.1 Authentication Security

- **Password Hashing:** bcrypt with cost factor 12
- **JWT Tokens:** RS256 signing, 15-minute expiry
- **Refresh Tokens:** Stored in database, 30-day expiry, rotatable
- **Rate Limiting:** 5 failed login attempts = 15-minute lockout

### 16.2 API Security

- **HTTPS Only:** Redirect all HTTP to HTTPS
- **CORS:** Whitelist only myautowhiz.com and app bundle
- **Helmet:** Set security headers (CSP, X-Frame-Options, etc.)
- **Input Validation:** Zod schemas for all request bodies
- **SQL Injection:** Prisma ORM with parameterized queries
- **XSS:** React auto-escapes, CSP headers

### 16.3 Data Security

- **Encryption at Rest:** Railway encrypts database storage
- **Encryption in Transit:** TLS 1.3 for all connections
- **PII Minimization:** Only collect necessary data
- **Data Retention:** Automatic deletion per policies

### 16.4 Third-Party Security

- **API Keys:** Stored in Railway environment variables
- **Webhook Verification:** Verify Stripe webhook signatures
- **OAuth State:** CSRF protection with state parameter

### 16.5 iOS Security

- **Keychain:** Store tokens in Keychain, not UserDefaults
- **Certificate Pinning:** Pin Railway/Cloudflare certificates
- **App Transport Security:** HTTPS required
- **No Logging Sensitive Data:** Strip tokens from logs

---

## 17. Testing Strategy

### 17.1 Unit Tests

**Backend:**
- Test individual service functions
- Mock external APIs
- Test validation schemas
- Test utility functions

**Frontend:**
- Test React components with React Testing Library
- Test hooks with renderHook
- Test utility functions

**iOS:**
- Test ViewModels
- Test Services with mock data
- Test utility functions

### 17.2 Integration Tests

**Backend:**
- Test API endpoints with supertest
- Use test database
- Seed test data
- Test authentication flows

### 17.3 End-to-End Tests

**Web:**
- Playwright for critical user flows
- Test signup → add vehicle → chat flow
- Test subscription upgrade flow

**iOS:**
- XCUITest for critical flows
- Test on multiple device sizes

### 17.4 Test Coverage Targets

| Area | Target |
|------|--------|
| API Services | 80% |
| API Controllers | 70% |
| React Components | 60% |
| iOS ViewModels | 70% |

---

## 18. Monitoring & Analytics

### 18.1 Error Tracking: Sentry

**Configuration:**
- Capture all unhandled exceptions
- Capture failed API requests
- Include user context (anonymized)
- Source maps for stack traces

**Alerts:**
- Spike in error rate
- New error type
- High error volume

### 18.2 Application Performance Monitoring

**Sentry APM:**
- Track API response times
- Track database query performance
- Track external API latency

**Thresholds:**
- API P95 < 500ms
- Database P95 < 100ms
- External API P95 < 2000ms

### 18.3 Business Analytics

**Track:**
- User signups (daily, weekly, monthly)
- VIN lookups (volume, by tier)
- Chat messages (volume, by session type)
- Subscription conversions (free → paid)
- Churn rate (monthly)
- Feature usage (which features are popular)

**Implementation:**
- Custom events stored in PostgreSQL
- Weekly digest email to admin
- Dashboard in admin panel (future)

### 18.4 Logging

**Structured Logging:**
- JSON format for machine parsing
- Include request ID for tracing
- Log levels: error, warn, info, debug
- Rotate logs daily, retain 30 days

**Log Aggregation:**
- Railway built-in log viewer
- Optional: Ship to external service (Logtail, Papertrail)

---

## 19. Development Workflow

### 19.1 Git Branching Strategy

- **main:** Production code, always deployable
- **develop:** Integration branch for features
- **feature/*:** Feature branches
- **fix/*:** Bug fix branches
- **release/*:** Release preparation

### 19.2 Pull Request Process

1. Create feature branch from develop
2. Implement feature with tests
3. Push and create PR to develop
4. Automated checks run (lint, test, build)
5. Code review required
6. Merge to develop
7. Periodic release branches merged to main

### 19.3 Code Quality

**Linting:**
- ESLint for TypeScript
- SwiftLint for Swift
- Prettier for formatting

**Pre-commit Hooks:**
- Lint staged files
- Run relevant tests
- Check commit message format

### 19.4 Environment Setup

**Local Development:**
1. Clone repository
2. Run `pnpm install` in root
3. Copy `.env.example` to `.env` and fill values
4. Start PostgreSQL and Redis (Docker or local)
5. Run `pnpm db:migrate` for migrations
6. Run `pnpm dev` to start all services

**Docker Compose for Local Services:**
```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: myautowhiz
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

---

## 20. Critical Implementation Notes

### 20.1 For Junior Developers

**DO:**
- Always validate user input on both client and server
- Use TypeScript strict mode
- Write descriptive commit messages
- Add comments for complex logic
- Test edge cases (empty inputs, network errors)
- Handle loading and error states in UI
- Log errors with context for debugging

**DON'T:**
- Never store passwords in plain text
- Never expose API keys in client code
- Never trust client-side data without validation
- Never skip error handling
- Never use `any` type in TypeScript
- Never commit .env files to Git

### 20.2 Production Readiness Checklist

Before each release:

- [ ] All tests passing
- [ ] No console.log statements (use logger)
- [ ] Error boundaries in React
- [ ] Loading states for all async operations
- [ ] Offline handling in iOS app
- [ ] Rate limiting configured
- [ ] Database indexes verified
- [ ] API documentation updated
- [ ] Environment variables set
- [ ] Sentry configured

### 20.3 Common Pitfalls to Avoid

1. **N+1 Queries:** Use Prisma includes/joins
2. **Unbounded Queries:** Always paginate
3. **Memory Leaks:** Cleanup event listeners
4. **Race Conditions:** Use proper async patterns
5. **Missing Loading States:** Always show loaders
6. **Poor Error Messages:** User-friendly error text

### 20.4 Performance Considerations

1. **Cache Aggressively:**
   - VIN decode results (24 hours)
   - Shop search results (1 hour)
   - Static content (CDN)

2. **Optimize Images:**
   - Compress on upload
   - Serve WebP format
   - Lazy load in lists

3. **Minimize Bundle Size:**
   - Code splitting in Next.js
   - Tree shaking
   - Analyze with bundle analyzer

4. **Database Optimization:**
   - Use indexes
   - Avoid SELECT *
   - Connection pooling

### 20.5 Scaling Considerations

**Current Architecture Supports:**
- 10,000+ users
- 100,000+ API requests/day
- 1,000+ concurrent connections

**For Further Scaling:**
- Add read replicas for PostgreSQL
- Increase API service replicas
- Add CDN for static assets
- Consider message queue for heavy processing

---

## Appendix A: API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Logout |
| GET | /user/profile | Get profile |
| PUT | /user/profile | Update profile |
| GET | /vehicles | List vehicles |
| POST | /vehicles | Add vehicle |
| GET | /vehicles/:id | Get vehicle |
| PUT | /vehicles/:id | Update vehicle |
| DELETE | /vehicles/:id | Delete vehicle |
| POST | /vin/decode | Decode VIN |
| GET | /vin/recalls/:vin | Get recalls |
| GET | /chat/sessions | List chats |
| POST | /chat/sessions | Create chat |
| POST | /chat/sessions/:id/messages | Send message |
| POST | /diagnostics/analyze | Run diagnosis |
| GET | /shops/nearby | Find shops |
| GET | /subscription | Get subscription |
| POST | /subscription/checkout | Create checkout |

---

## Appendix B: Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| INVALID_VIN | 400 | VIN format invalid |
| UNAUTHORIZED | 401 | Not authenticated |
| TOKEN_EXPIRED | 401 | JWT expired |
| FORBIDDEN | 403 | No permission |
| TIER_LIMIT | 403 | Feature not in tier |
| RATE_LIMITED | 429 | Too many requests |
| USAGE_LIMIT | 429 | Monthly limit reached |
| NOT_FOUND | 404 | Resource not found |
| INTERNAL_ERROR | 500 | Server error |

---

## Appendix C: Subscription Limits

| Feature | Free | Pro | Family | Dealer |
|---------|------|-----|--------|--------|
| VIN Lookups/month | 5 | ∞ | ∞ | ∞ |
| Chat Messages/month | 20 | 200/day | 500/day | ∞ |
| Image Analyses/month | 3 | 30 | 100 | ∞ |
| Vehicles | 1 | 3 | 10 | ∞ |
| Chat History | 30 days | 90 days | 1 year | ∞ |
| Repair Guides | Preview | Full | Full | Full |
| Shop Results | 10 | ∞ | ∞ | ∞ |
| API Access | No | No | No | Yes |
| Bulk VIN Decode | No | No | No | Yes |

---

*End of Technical Specification*

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Technical Architecture Team*
