# 🔥 ROAST'em

ROAST'em is a realtime, brutally honest, and anonymous social platform for GenZ. Think of it like Reddit, but everyone is here to roast each other to earn **Aura Points**.

## Features

- **Aura Economy**: You start with 200 Aura. Roasting someone earns you Aura. Getting roasted burns your Aura. Liking a roast transfers Aura from you to the roaster.
- **Realtime Feed**: Watch the global feed update instantly as people drop roasts, powered by Supabase Realtime.
- **Roast Battles**: Hit back with a comeback within a 2-minute window. 
- **Shields**: Buy a 48-hour shield for 50 Aura to protect yourself from incoming roasts.
- **Leaderboard**: See who has the most Aura on the platform.
- **Moderation**: Rate limiting (5 roasts/hr), automated word filters, and a user reporting/blocking system to keep things spicy but safe.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Auth, RPCs)
- **Styling**: Vanilla CSS, Framer Motion for animations
- **Icons**: Lucide React

## Local Development

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/roast-em.git
cd roast-em
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Supabase
1. Create a project on [Supabase](https://supabase.com).
2. Go to the SQL Editor and run all migrations found in the `docs/` folder (starting from `migration_v1.sql` up to `migration_v7.sql`).
3. Copy your project URL and Anon Key.

### 4. Configure Environment Variables
Create a `.env.local` file in the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start roasting.

## Deployment

This project is configured to be deployed on Vercel. Don't forget to add your Supabase URL and Anon Key to your Vercel Environment Variables, and add your Vercel deployment URL to Supabase's Auth Redirect URLs.
