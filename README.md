# Whop Zoom Integration - Marketplace App

A **multi-tenant** Whop marketplace app that allows any Whop seller to integrate Zoom livestreaming into their products. Each seller configures their own Zoom credentials through an admin settings page.

## Features

- **Multi-Tenant Architecture** - Each company has their own Zoom credentials
- **Seller Admin Page** - `/seller` route for configuring Zoom integration
- **Whop Marketplace Ready** - Install on any Whop and configure per-company
- **Instant Meetings** - One-click "Go Live" button (admin only)
- **Zoom Meeting SDK** - Embedded meetings within Whop
- **Auto-dated Titles** - Format: `Livestream MM-DD-YYYY`
- **Per-Company Admin Controls** - Configurable admin usernames per company

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Auth**: Whop SDK (@whop-apps/sdk)
- **Video**: Zoom Meeting SDK (@zoom/meetingsdk)
- **Styling**: Tailwind CSS + Frosted UI
- **Storage**: Whop App Data API (per-company settings)
- **Deployment**: Vercel

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Whop Marketplace                          │
├─────────────────────────────────────────────────────────────┤
│  Company A          Company B          Company C            │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐           │
│  │ Zoom    │       │ Zoom    │       │ Zoom    │           │
│  │ Creds A │       │ Creds B │       │ Creds C │           │
│  └─────────┘       └─────────┘       └─────────┘           │
│       │                 │                 │                 │
│       └─────────────────┼─────────────────┘                 │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │  Zoom Integration   │                        │
│              │       App           │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Whop Marketplace Setup

### 1. Create a Whop App

1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
2. Create a new app
3. Configure the following paths:
   - **Seller Path**: `/seller` (for admin configuration)
   - **Customer Path**: `/experiences/$experienceId` (for viewing streams)

### 2. Configure Hosting

In the **Hosting** section:
- **Base URL**: Your deployed domain (e.g., `https://your-app.vercel.app`)

### 3. Environment Variables (App-Level)

These are for the app itself, not per-company:

```env
# Whop App Credentials
WHOP_API_KEY=your_whop_api_key

# Fallback credentials (optional, for development)
ZOOM_SDK_KEY=your_sdk_key
ZOOM_SDK_SECRET=your_sdk_secret
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
ADMIN_USERNAMES=your_username
```

## For Sellers (Per-Company Setup)

When a seller installs this app on their Whop, they need to:

### 1. Access Admin Settings

Navigate to the **Seller** view in the Whop app (automatically routed to `/seller`)

### 2. Create Zoom Apps

Create two Zoom apps at [Zoom App Marketplace](https://marketplace.zoom.us/):

#### Server-to-Server OAuth App (for API access)
- **Account ID**: Found in app credentials
- **Client ID**: Found in app credentials  
- **Client Secret**: Found in app credentials
- Required scopes: `meeting:write:admin`, `meeting:read:admin`, `user:read:admin`

#### Meeting SDK App (for embedding meetings)
- **SDK Key**: Found in app credentials
- **SDK Secret**: Found in app credentials

### 3. Enter Credentials

In the seller settings page, enter:
- Account ID, Client ID, Client Secret (from Server-to-Server OAuth)
- SDK Key, SDK Secret (from Meeting SDK)
- Optional: Permanent Meeting ID, Default Meeting Title

### 4. Save & Validate

The app will validate credentials with Zoom before saving.

## Routes

| Route | Description |
|-------|-------------|
| `/seller` | Seller admin settings page |
| `/experiences/[experienceId]` | Customer view (stream lobby) |
| `/meeting/live` | Live meeting viewer |
| `/api/settings/zoom` | GET/POST Zoom credentials |
| `/api/zoom/signature/[companyId]` | Generate SDK signature |
| `/api/zoom/live-meeting/[companyId]` | Check for live meetings |
| `/api/zoom/create-meeting/[companyId]` | Create instant meeting |
| `/api/zoom/end-meeting/[companyId]` | End a meeting |

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

1. Deploy to Vercel
2. Add `WHOP_API_KEY` environment variable
3. Update Whop app **Base URL** to your Vercel domain
4. Publish app to Whop Marketplace

## How It Works

1. **Seller installs app** → Redirected to `/seller` to configure Zoom
2. **Seller enters Zoom credentials** → Stored per-company via Whop App Data API
3. **Customer accesses experience** → App fetches company's Zoom credentials
4. **Admin starts stream** → Meeting created using company's Zoom account
5. **Customers join** → SDK signature generated with company's SDK credentials

## Security

- Zoom credentials are stored encrypted via Whop's App Data API
- Credentials are never exposed to the client
- SDK secrets are only used server-side for signature generation
- Each company's credentials are isolated
