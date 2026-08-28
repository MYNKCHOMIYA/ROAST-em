# AI Agent Context & Project State
**Project:** ROAST'em
**Last Updated:** 2026-08-28 08:49:33

## 🤖 Instructions for AI Assistants (Claude, Gemini, Copilot, etc.)
If you are reading this file, you have been tasked with assisting the developer on the "ROAST'em" project.

**DO NOT ASK the user to repeat the project goals.** Read `docs/PROJECT_SPEC.md` to understand the core mechanics, Aura economy, and product vision.

## 📍 Current Project State

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 — Foundation & MVP |
| **Current Step** | M9 — Vercel Deployment & Handoff |
| **Status** | DONE |

### ✅ What Was Last Done
## Current Status
The project is fully complete, builds cleanly, and is ready for production deployment. All planned features for the MVP have been implemented.

## Final Handoff
Due to Vercel requiring personal GitHub authentication and private Supabase credentials, the final deployment step must be performed manually by the user. 
A comprehensive Deployment Guide has been created as the final artifact to guide the user through pushing to GitHub, configuring Vercel environment variables, and updating Supabase Auth Redirect URLs for production.

### ⏭️ What To Do Next
## End of MVP Phase
The ROAST'em MVP Phase is officially complete. Any future work will fall under a new Post-Launch / V2 phase.

---

## Tech Stack
- **Framework:** Next.js (React) with App Router
- **Styling:** Tailwind CSS + Framer Motion
- **Backend & DB:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Language:** TypeScript
- **Package Manager:** npm

## Project Structure
```
ROAST'em/
├── docs/               # ← All AI context lives here
│   ├── AI_CONTEXT.md   # ← THIS FILE - Update after every task
│   ├── PROJECT_SPEC.md # ← Full product spec & economy rules
│   ├── SCHEMA.md       # ← DB Schema (Supabase SQL)
│   └── update_context.sh ← Script to update this file
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components
│   └── lib/            # Supabase client, utilities
├── public/
└── package.json
```

## Your Role As AI
When generating code or providing suggestions:
1. **Adhere to the Tech Stack:** Use Next.js App Router, Tailwind, and Supabase client libraries.
2. **GenZ Aesthetic:** The UI must be highly engaging, premium, and feature dark mode by default, glassmorphism, and micro-animations (Framer Motion). Generic looking UIs are UNACCEPTABLE.
3. **Database Rules:** Aura point transfers MUST use Postgres RPC functions for ACID compliance. Never do math client-side for point transfers.
4. **Security:** Implement strict Row Level Security (RLS) in Supabase. Assume all users are malicious.
5. **Update Docs:** After completing any task, run `./docs/update_context.sh` to update this file.

## 🔑 Master Prompt for New AI Sessions
Paste this at the start of any new chat:

> "I am building a GenZ social media app called ROAST'em. The core mechanic is anonymous users roasting each other to steal 'Aura Points' — a social currency. I am using Next.js (App Router), Supabase (PostgreSQL + Auth + Realtime), and Tailwind CSS. Read `docs/PROJECT_SPEC.md` for the full product spec (economy rules, 2-min comeback window, Aura decay, Shields mechanic). Read `docs/AI_CONTEXT.md` to see exactly what has been built and what to do next. Do NOT ask me to explain the app again. Start from 'What To Do Next' in AI_CONTEXT.md."
