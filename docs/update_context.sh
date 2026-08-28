#!/bin/bash
# ============================================================
# update_context.sh - ROAST'em AI Context Updater
# Run this after EVERY major task completion.
# Usage: ./docs/update_context.sh "Step Name" "Status (DONE/IN_PROGRESS)" "What was done" "What is next"
# ============================================================

STEP_NAME="$1"
STATUS="$2"
DONE_SUMMARY="$3"
NEXT_STEP="$4"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Update the AI_CONTEXT.md with the latest state
cat > "$(dirname "$0")/AI_CONTEXT.md" << HEREDOC
# AI Agent Context & Project State
**Project:** ROAST'em
**Last Updated:** $TIMESTAMP

## 🤖 Instructions for AI Assistants (Claude, Gemini, Copilot, etc.)
If you are reading this file, you have been tasked with assisting the developer on the "ROAST'em" project.

**DO NOT ASK the user to repeat the project goals.** Read \`docs/PROJECT_SPEC.md\` to understand the core mechanics, Aura economy, and product vision.

## 📍 Current Project State

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 — Foundation & MVP |
| **Current Step** | $STEP_NAME |
| **Status** | $STATUS |

### ✅ What Was Last Done
$DONE_SUMMARY

### ⏭️ What To Do Next
$NEXT_STEP

---

## Tech Stack
- **Framework:** Next.js (React) with App Router
- **Styling:** Tailwind CSS + Framer Motion
- **Backend & DB:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Language:** TypeScript
- **Package Manager:** npm

## Project Structure
\`\`\`
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
\`\`\`

## Your Role As AI
When generating code or providing suggestions:
1. **Adhere to the Tech Stack:** Use Next.js App Router, Tailwind, and Supabase client libraries.
2. **GenZ Aesthetic:** The UI must be highly engaging, premium, and feature dark mode by default, glassmorphism, and micro-animations (Framer Motion). Generic looking UIs are UNACCEPTABLE.
3. **Database Rules:** Aura point transfers MUST use Postgres RPC functions for ACID compliance. Never do math client-side for point transfers.
4. **Security:** Implement strict Row Level Security (RLS) in Supabase. Assume all users are malicious.
5. **Update Docs:** After completing any task, run \`./docs/update_context.sh\` to update this file.

## 🔑 Master Prompt for New AI Sessions
Paste this at the start of any new chat:

> "I am building a GenZ social media app called ROAST'em. The core mechanic is anonymous users roasting each other to steal 'Aura Points' — a social currency. I am using Next.js (App Router), Supabase (PostgreSQL + Auth + Realtime), and Tailwind CSS. Read \`docs/PROJECT_SPEC.md\` for the full product spec (economy rules, 2-min comeback window, Aura decay, Shields mechanic). Read \`docs/AI_CONTEXT.md\` to see exactly what has been built and what to do next. Do NOT ask me to explain the app again. Start from 'What To Do Next' in AI_CONTEXT.md."
HEREDOC

echo "✅ AI_CONTEXT.md updated at $TIMESTAMP"
echo "   Step: $STEP_NAME"
echo "   Status: $STATUS"
