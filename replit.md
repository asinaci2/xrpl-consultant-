# Edwin Gutierrez Consulting Website

## Overview

This is a professional consulting website for Edwin Gutierrez, a blockchain consultant specializing in XRP Ledger (XRPL) enterprise solutions. The site features a modern landing page with sections for services, about, and contact, plus a real-time chat widget for visitor communication.

The application follows a full-stack architecture with a React frontend and Express backend, using PostgreSQL for data persistence and WebSockets for real-time chat functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for scroll animations and transitions
- **Smooth Scrolling**: react-scroll for navigation links
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts`
- **Real-time**: WebSocket server (ws library) for live chat
- **Validation**: Zod schemas shared between client and server

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between frontend/backend)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` folder used by both client and server
- **API Contract**: Route definitions with Zod validation in `shared/routes.ts`
- **Component Library**: shadcn/ui components in `client/src/components/ui/`
- **Path Aliases**: `@/` for client source, `@shared/` for shared code

### Project Structure
```
client/           # React frontend
  src/
    components/   # React components including ui/ for shadcn
    pages/        # Page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
  routes.ts       # API route definitions with Zod
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage (available but not currently active)

### UI Component Library
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Underlying primitive components for accessibility
- **Tailwind CSS**: Utility-first CSS framework

### Real-time Communication
- **ws**: WebSocket library for real-time chat between visitors and admin

### Form Handling
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod resolver for form validation

### Fonts
- Google Fonts: Outfit (display), DM Sans (body)

### Twitter Integration
- **API Service**: `server/twitter.ts` - Twitter API v2 integration with OAuth 1.0a
- **Database Caching**: Tweets stored in `cached_tweets` table with 2-hour refresh interval
- **Rate Limiting**: 15-minute backoff after 429 errors
- **Fallback Data**: Pre-configured tweets display when API is unavailable
- **Endpoints**: 
  - `GET /api/twitter/tweets?count=N` - Fetch user timeline (from cache or API)
  - `GET /api/twitter/search?q=query` - Search tweets
- **Required Secrets**: TWITTER_BEARER_TOKEN, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET

### Matrix-Style Display
- **Component**: `client/src/components/MatrixTweets.tsx`
- **Animation**: Canvas-based Matrix rain effect with green cascading characters
- **Features**: Auto-rotating tweet carousel (5-second intervals), navigation dots, engagement stats
- **Performance**: Uses requestAnimationFrame with canvas rendering instead of React state updates

### Stories Feature (WhatsApp/Instagram-style)
- **Components**: 
  - `StoriesHeader.tsx` - Horizontal scrollable row of circular story bubbles with green glow effects
  - `StoryViewer.tsx` - Full-screen modal with progress bars, keyboard navigation, tap-to-pause
  - `Stories.tsx` - Section wrapper integrating header and viewer
- **Database**: `stories` table with content, imageUrl, authorName, authorImage, createdAt, expiresAt
- **Expiration**: Stories auto-expire after 24 hours
- **Endpoints**:
  - `GET /api/stories` - Returns active (non-expired) stories
  - `POST /api/stories` - Creates new story with optional image upload to Matrix
- **Styling**: Matrix cyberpunk theme with green glows, dark gradients, monospace fonts