# PinBot - Pinterest Automation Agent

**Autonomous Pinterest content automation** — Upload a content calendar, and PinBot's AI generates optimized pins, creates images using free AI services, and schedules 3–5 pins per day automatically.

## Features

- **AI Content Generation** — From a single topic, generates titles, descriptions, hashtags, keywords, alt text, CTAs, and custom images
- **Free Image Generation** — Uses Pollinations.ai (free, no API key), with fallback to HuggingFace Inference API
- **Multi-Format Upload** — CSV, Word documents, PDFs, plain text — the AI parses them all
- **Smart Scheduling** — Distributes pins at optimal times, generates variations from single topics
- **Calendar Dashboard** — Drag-and-drop rescheduling, day-by-day pin previews
- **AI Chat Assistant** — PinBot chat helps manage strategy, analytics, and content
- **Analytics Dashboard** — Impression tracking, saves, clicks, board performance
- **Autonomous Background Worker** — Runs 24/7, publishes pins, sends email digests
- **Notifications** — Daily digest, failure alerts, calendar expiry warnings, monthly reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL (via Supabase or any Postgres) |
| ORM | Prisma |
| Auth | NextAuth.js (credentials + OAuth) |
| AI Chat | Groq API (primary) / OpenRouter (fallback) |
| Image Gen | Pollinations.ai (primary) / HuggingFace (fallback) |
| Image Processing | Sharp.js |
| Job Queue | BullMQ + Redis |
| Email | SendGrid |
| Charts | Recharts |
| Calendar | FullCalendar |
| Deployment | Vercel (app) + Railway (worker) / Docker |

## Prerequisites

- Node.js 20+
- PostgreSQL database (free: [Supabase](https://supabase.com))
- Redis instance (free: [Upstash](https://upstash.com))
- API keys (see below)

## API Keys Needed (All Free Tier)

| Service | Purpose | Free Tier | Setup |
|---------|---------|-----------|-------|
| [Groq](https://console.groq.com) | AI Chat + Content Generation | 14,400 requests/day | Create account, get API key |
| [Pollinations.ai](https://pollinations.ai) | Image Generation | Unlimited, free | No API key needed |
| [HuggingFace](https://huggingface.co) | Fallback Image Gen | 30K requests/month | Free account, API key |
| [OpenRouter](https://openrouter.ai) | Fallback AI | Free models available | Free account, API key |
| [Supabase](https://supabase.com) | PostgreSQL Database | 500MB free | Create project, get connection string |
| [Upstash](https://upstash.com) | Redis | 10K commands/day | Create database, get Redis URL |
| [SendGrid](https://sendgrid.com) | Email | 100 emails/day | Free account, API key |
| [Cloudinary](https://cloudinary.com) | Image Storage | 25GB free | Optional, for image storage |

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd pin
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
AUTH_SECRET=your-random-secret-here
GROQ_API_KEY=gsk_your-groq-api-key
PINTEREST_CLIENT_ID=your-pinterest-app-id
PINTEREST_CLIENT_SECRET=your-pinterest-app-secret
REDIS_URL=redis://default:password@upstash-redis-url:6379
SENDGRID_API_KEY=SG.your-sendgrid-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key
HUGGINGFACE_API_KEY=hf_your-huggingface-key
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Application

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Background worker (optional - for auto-publishing)
npm run worker
```

### 5. Connect Pinterest

1. Go to [Pinterest Developer Portal](https://developers.pinterest.com)
2. Create a new app
3. Set redirect URI: `http://localhost:3000/api/auth/callback/pinterest`
4. Copy Client ID and Secret to `.env.local`
5. Sign in to PinBot and connect your Pinterest account

## Usage

### Upload a Content Calendar

1. Download the CSV template from the upload page
2. Fill in at minimum: `date`, `topic_or_title`, `blog_url`, `board_name`
3. Upload the file — the AI parses and generates everything else
4. Review the generated content preview
5. Click "Generate & Schedule" — AI creates titles, descriptions, images, hashtags
6. View the calendar, drag-and-drop to adjust timing
7. The background worker publishes pins automatically at scheduled times

### CSV Template Format

```csv
date,topic_or_title,blog_url,board_name,content_category,extra_notes,preferred_style,pins_per_day
2026-07-05,Easy Healthy Breakfast Ideas,https://myblog.com/healthy-breakfast,Food & Nutrition,Food,"Warm colors, family focus",flat lay,4
```

Only `date`, `topic_or_title`, `blog_url`, and `board_name` are required. The AI generates everything else.

### Using the AI Chat Assistant

Click the chat bubble (bottom-right) to ask PinBot:

- "Generate 5 pin ideas for my yoga blog"
- "Move all pins from July 15th to July 20th"
- "Which of my pins performed best last month?"
- "Regenerate the image for my July 10th breakfast pin"
- "My pins aren't getting saves, what should I do?"
- "Add 3 pins about meal prep to my schedule"

## Project Structure

```
pin/
├── prisma/              # Database schema and migrations
│   └── schema.prisma
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth + registration
│   │   │   ├── pins/        # Pin CRUD operations
│   │   │   ├── chat/        # AI chat assistant
│   │   │   ├── upload/      # File upload and parsing
│   │   │   ├── calendar/    # Calendar management
│   │   │   ├── generate/    # AI content generation
│   │   │   ├── analytics/   # Analytics data
│   │   │   ├── settings/    # User settings
│   │   │   ├── boards/      # Pinterest boards
│   │   │   ├── health/      # Health check
│   │   │   └── webhook/     # Pinterest webhooks
│   │   ├── dashboard/       # Main dashboard
│   │   ├── calendar/        # Calendar view + upload
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── settings/        # Settings panel
│   │   ├── library/         # Content library
│   │   ├── onboarding/      # Onboarding wizard
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── layout/     # Navbar, providers
│   │   └── chat/       # Chat bubble component
│   └── lib/
│       ├── auth.ts          # NextAuth configuration
│       ├── prisma.ts        # Prisma client
│       ├── ai.ts            # AI service (Groq + OpenRouter)
│       ├── image.ts         # Image generation (Pollinations + HF)
│       ├── pinterest.ts     # Pinterest API client
│       ├── scheduler.ts     # Scheduling engine
│       ├── parser.ts        # File parsing (CSV/Word/PDF)
│       ├── notifications.ts # Email + in-app notifications
│       └── utils.ts         # Utility functions
├── worker/
│   └── index.js         # Background worker (24/7 automation)
├── types/
│   └── index.ts         # TypeScript type definitions
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Authentication |
| `/api/auth/register` | POST | User registration |
| `/api/pins` | GET | List all pins |
| `/api/pins` | POST | Generate/schedule/publish |
| `/api/pins` | PATCH | Update pin status/date |
| `/api/pins` | DELETE | Bulk delete pins |
| `/api/chat` | POST | AI chat assistant |
| `/api/upload` | POST | Upload and parse files |
| `/api/generate` | POST | Generate content for calendar |
| `/api/calendar` | GET | Get calendar entries |
| `/api/calendar` | POST | Update entry date |
| `/api/analytics` | GET | Analytics data |
| `/api/settings` | GET | Get user settings |
| `/api/settings` | PUT | Update settings |
| `/api/boards` | GET | Pinterest boards |
| `/api/health` | GET | Health check |
| `/api/webhook` | POST | Pinterest webhooks |

## Deployment

### Docker

```bash
docker-compose up -d
```

### Vercel (Frontend + API)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Railway (Background Worker)

1. Create a new Railway service from the same repo
2. Set start command: `npm run worker`
3. Set environment variables

## License

MIT
