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

### Cached Media System
- **Service**: `server/media.ts` - Multi-source image resolver with database caching
- **Database**: `cached_media` table with source, sourceUrl, imageUrl, section, altText, displayOrder, isActive, fetchedAt
- **Sources**: Instagram (oEmbed), TikTok (oEmbed), Google Drive (direct link parsing), Manual URLs
- **Caching**: 6-hour refresh interval for oEmbed sources, rate limit backoff on 429 errors
- **Auto-seed**: Seeds Hero and About section images on first run if table is empty
- **Endpoints**:
  - `GET /api/media/:section` - Returns cached media for a section (e.g., `/api/media/hero`)
  - `GET /api/media` - Returns all media entries
  - `POST /api/media` - Creates new media entry (resolves image URL from source)
  - `DELETE /api/media/:id` - Removes a media entry
- **Frontend**: Hero.tsx and About.tsx fetch images from `/api/media/hero` and `/api/media/about` with fallback URLs
- **Usage**: Add images via API: `POST /api/media` with `{source: "instagram|tiktok|gdrive|manual", sourceUrl: "...", section: "hero|about"}`

### Visual Theme
- **Full-page Matrix rain**: Fixed canvas background (z-0) behind all content via `MatrixRain` component in Home.tsx
- **Dark theme**: All sections use semi-transparent dark backgrounds (bg-black/70 to bg-black/90) with backdrop-blur
- **Color scheme**: Green accents (green-400/500), white headings, gray-300/400 body text, green-500/20 borders
- **Navigation**: Glass-nav effect with bg-black/80 backdrop-blur, green accent buttons

### Admin Dashboard
- **Page**: `client/src/pages/Admin.tsx` at route `/admin`
- **Tabs**: Media, Projects, Stories, Inquiries, Tweets
- **Projects Tab**: Add/edit/delete/toggle featured projects with title, subtitle, description, impact, URL, icon, color, tags
- **Media Tab**: View/add/delete/toggle media entries; supports manual, Instagram, TikTok, Google Drive sources
- **Stories Tab**: Create/delete stories with content, author name, optional image URL
- **Inquiries Tab**: View/delete contact form submissions
- **Tweets Tab**: View cached tweets, force refresh from Twitter API
- **Additional API Endpoints**:
  - `PATCH /api/media/:id` - Update media fields (isActive, altText, displayOrder, section)
  - `GET /api/inquiries` - List all inquiries
  - `DELETE /api/inquiries/:id` - Delete an inquiry
  - `GET /api/stories/all` - List all stories (including expired)
  - `DELETE /api/stories/:id` - Delete a story
  - `POST /api/twitter/refresh` - Force refresh Twitter cache
  - `GET /api/projects` - List active projects
  - `GET /api/projects/all` - List all projects (including inactive)
  - `POST /api/projects` - Create a project
  - `PATCH /api/projects/:id` - Update project fields
  - `DELETE /api/projects/:id` - Delete a project

### Featured Projects
- **Database**: `projects` table with title, subtitle, description, impact, link, icon, color, tags, displayOrder, isActive
- **Frontend**: `client/src/components/Projects.tsx` fetches from `/api/projects` with icon name-to-component mapping
- **Auto-seed**: 4 initial projects seeded on first run (TextRP Ambassador, Budzy Movement, Crypto Fam Radio, XRP Warlords)
- **Icons**: Mapped by name string (MessageSquare, Heart, Radio, Gamepad2, Briefcase, Globe, Star, Zap, Shield, Code, Users, Rocket, Award, Target)