# ROAST'em - Project Specification

## 1. Project Overview
**Name:** ROAST'em (Working Title)
**Purpose:** A GenZ-focused entertainment social media platform where users interact purely by roasting each other.
**Target Audience:** GenZ, 18+ (strictly enforced due to harsh content).
**Core Concept:** Anonymity meets a brutal, economy-driven roasting ecosystem. Users burn others to gain status, represented by "Aura Points."

## 2. Core Mechanics

### The Aura Economy
- **Aura Points:** The primary currency and status indicator of the app.
- **Starter Balance:** New users receive 200 starter points to encourage immediate participation.
- **Transaction Mechanics:** 
  - When User A roasts User B, and User C "likes" the roast:
    - User C spends Aura (e.g., 10 points).
    - User A (Roaster) gains those points (now +10 Aura).
    - User B (Roasted) loses those points from their total balance (now -10 Aura).
- **Aura Decay (Inflation Control):** A weekly decay (e.g., 1-2% burn rate) is applied to all balances to keep points scarce, meaningful, and prevent hoarding.

### The Roast Mechanics
- **Formats Supported:** Text dialogues, GIFs, videos, and pictures.
- **Roast Battles (The Comeback Window):** When roasted, the target has a strict 2-minute "comeback window" to fire back before the Aura points officially transfer. This creates live, high-stakes tension.
- **Shields (Anti-Bullying/Coordination):** Users can spend Aura points to activate a "Shield," capping their daily exposure to point loss and preventing coordinated group attacks.

### User Identity & Social Graph
- **Anonymity:** Users operate under anonymous handles. True identities are never exposed on the feed.
- **Strict 1-Account Rule:** Enforced via Phone Number + Device Fingerprint + Biometric Check during signup. 
- **Following:** Users can follow handles to populate their feed with specific rivalries and roasts.
- **Random Feed:** Users without followers or those exploring will see a global/trending feed.

## 3. Needs & Requirements (Phase 1)
For Phase 1 (MVP - Minimum Viable Product), we will focus on the foundational elements:
- User Authentication (Phone OTP + Device fingerprinting basic setup).
- Database Schema for Users, Posts (Roasts), and Aura Ledger (Transactions).
- Basic Feed UI (Following & Global).
- Ability to create a text/image roast targeting another user handle.
- The Like/Aura transfer mechanism (without the live 2-min window for V1, or simplified).

## 4. Proposed Tech Stack
- **Framework:** Next.js (React) - For fast development, API routes, and easy transition to mobile-first PWA.
- **Database & Auth:** Supabase (PostgreSQL) - Crucial for real-time features (comebacks), ACID-compliant Aura point transactions, and Phone OTP auth.
- **Styling:** Tailwind CSS + Framer Motion - Essential for the premium, dynamic, and animated GenZ aesthetic (dark mode, glassmorphism).
- **Storage:** Supabase Storage (for images/videos).
- **Deployment:** Vercel.

## 5. Future Phases
- **Phase 2:** Advanced Media (Video/GIF integrations), Comeback Window real-time sockets.
- **Phase 3:** Shields, Aura Decay CRON jobs.
- **Phase 4:** React Native mobile application launch.
