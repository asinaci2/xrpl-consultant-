# TextRP Consultant Network

## Overview

This project is a multi-tenant consultant directory designed for the TextRP / XRPL ecosystem. It features a public landing page displaying consultant cards and individual, detailed profile pages for each consultant. The application aims to connect users with consultants in the TextRP/XRPL space, offering features like real-time chat, dynamic content display (stories, projects, media), and comprehensive consultant profiles. It supports both admin and consultant self-service dashboards for content management. The core vision is to create a centralized, interactive platform for professional networking and service discovery within the TextRP community.

## User Preferences

Preferred communication style: Simple, everyday language.

Development philosophy: Keep code modular — split concerns into components, hooks, utilities, and config files rather than large monolithic blocks. Avoid hardcoding values inline; URLs, labels, color tokens, limits, and config should live in constants or config objects. Prefer data-driven patterns — render from arrays/objects rather than repeated JSX blocks.

## System Architecture

### Core Technologies
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for state, Tailwind CSS with shadcn/ui for styling, Framer Motion for animations, Vite for bundling.
-   **Backend**: Express 5 on Node.js with TypeScript, `ws` for WebSockets, PostgreSQL for data, Drizzle ORM for database interaction, Zod for schema validation.

### Data Model
-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Shared Schema**: Database schemas are defined in `shared/schema.ts` and used by both frontend and backend.
-   **Key Entities**: `consultants`, `projects`, `stories`, `cached_media`, `cached_tweets`, `contact_info`, `chat_host_config`, `testimonials`, `visitor_contacts`.

### Multi-Tenant Design
-   Consultants are managed via unique slugs (`/c/:slug`).
-   Data (projects, stories, media, contact info) is scoped to individual consultants.

### Features
-   **Consultant Directory**: Displays all active consultants.
-   **Consultant Profile Pages**: Detailed pages for each consultant.
-   **Real-time Chat**: WebSocket-based chat between visitors and consultants. Chat sessions on `/c/:slug` are routed directly to that consultant's Matrix account — the correct person receives the visitor's messages in their TextRP/Matrix client.
-   **TextRP Backroom Sync**: A background loop (`server/sync.ts`) polls TextRP Matrix rooms every 60 seconds. Membership in `ADMIN_MATRIX_ROOM` grants admin access live (no re-login required). Membership in `CONSULTANT_MATRIX_ROOM` auto-creates/activates consultant records; removal deactivates them. `SYNC_EXCLUDE_MATRIX_IDS` (comma-separated) skips auto-creation for specific IDs while still granting dashboard access.
-   **Profile Room Sync**: Consultants invite the bot to their personal TextRP room — the bot detects this automatically, reads the room's name/avatar/topic, and populates that consultant's chat widget profile. Runs every 60 seconds. Consultants can also manually link a room ID from their dashboard Chat Widget tab.
-   **Per-Consultant Chat Widget**: The `ChatWidget` on `/c/:slug` fetches that consultant's specific chat profile via `GET /api/chat/host-config/:slug`, falling back to their main profile data if no custom config exists.
-   **Dynamic Content**:
    -   **Stories**: WhatsApp/Instagram-style expiring content for consultants.
    -   **Projects**: Consultant project showcases.
    -   **Media**: Cached images/videos from various sources (Instagram, TikTok, Google Drive).
-   **Twitter Integration**: Displays consultant's tweets, with caching and rate limiting.
-   **Testimonials System**: Visitors can submit testimonials for consultants from their profile page (pending approval). Consultants approve/reject from their dashboard Testimonials tab. Manual dashboard adds are auto-approved.
-   **Visitor Dashboard**: Logged-in users without a consultant/admin role get a lightweight personal dashboard at `/dashboard` with: (1) XRPL wallet display (balance, NFT count, owner count, links to Bithomp/XRPScan — derived from Matrix user ID), (2) My Contacts (saved consultants from the directory), (3) My Testimonials (all submissions with status badges).
-   **Save to Contacts**: Visitors can save consultants to their personal contact list via a "Save to My Contacts" button on each consultant's profile hero section. Stored in `visitor_contacts` table.
-   **Admin Dashboard**: Centralized management for consultants, media, projects, stories, inquiries, and chat profiles.
-   **Consultant Dashboard**: Self-service portal for consultants to manage their profile, projects, stories, media, and chat settings.
-   **Authentication**: SSO via Matrix homeserver and Xumm (XRPL wallet), with role-based access control (Admin, Consultant, Visitor).

### File Structure
-   **Shared constants**: `client/src/lib/constants.ts` — all URLs, refetch intervals, brand colors, and gradients live here.
-   **Dashboard tabs**: `client/src/components/dashboard/` — each tab is its own file (`ProfileTab.tsx`, `ProjectsTab.tsx`, `StoriesTab.tsx`, `MediaTab.tsx`, `ChatWidgetTab.tsx`, `TestimonialsTab.tsx`, `ContactInfoTab.tsx`, `WalletTab.tsx`, `VisitorContactsTab.tsx`, `VisitorTestimonialsTab.tsx`). Shared context in `context.ts`, types in `types.ts`, constants in `constants.ts`.
-   **Admin tabs**: `client/src/components/admin/` — each tab is its own file (`ConsultantsTab.tsx`, `MediaTab.tsx`, `StoriesTab.tsx`, `InquiriesTab.tsx`, `TweetsTab.tsx`, `ProjectsTab.tsx`, `ChatProfileTab.tsx`, `ContactTab.tsx`, `SyncTab.tsx`). Types in `types.ts`.

### UI/UX and Visual Theme
-   **Design System**: Tailwind CSS with shadcn/ui components for a consistent and accessible interface.
-   **Theming**: Dark theme with green accents, white headings, and gray body text. Includes a full-page Matrix rain effect for a distinctive cyberpunk aesthetic. Day mode is also supported.
-   **Animations**: Framer Motion for scroll animations and transitions, enhancing user experience.

## External Dependencies

### Database
-   **PostgreSQL**: Primary data store.
-   **connect-pg-simple**: PostgreSQL-backed session storage for authentication.

### UI/Styling Libraries
-   **shadcn/ui**: Component library built on Radix UI.
-   **Radix UI**: Primitive components for accessibility.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **Google Fonts**: Outfit (display) and DM Sans (body) for typography.

### Real-time Communication
-   **ws**: WebSocket library for live chat functionality.

### Form Management
-   **react-hook-form**: Form state management.
-   **@hookform/resolvers**: Zod resolver for form validation with React Hook Form.

### Authentication
-   **Xumm**: XRPL wallet for SSO identity provision via OIDC.
-   **express-session**: Session management middleware.

### Third-Party API Integrations
-   **Twitter API v2**: For fetching and displaying tweets (with OAuth 1.0a).
-   **Instagram oEmbed**: For embedding Instagram media.
-   **TikTok oEmbed**: For embedding TikTok media.
-   **XRPL Public API** (`xrplcluster.com`): Proxied server-side to fetch visitor wallet data (balance, NFTs, owner count) — no API key required.