# GetCampusGig Orientation

**Public elevator pitch + logo:** see the repo [README](../README.md) on GitHub (friendly NMSU-first intro).

## Answers

- What is GetCampusGig and its fundamental stack?
- What is the critical user flow for tasks?
- What is the core color system?
- How do payment tags and Karma Kredit work?
- What are the strict boundaries for AI assistance in this repository?

**GetCampusGig** is a campus micro-task marketplace restricted entirely to college students (nmsu.edu emails only).

**Tech Stack:** React, Supabase, Vercel

## Critical User Flow

1. **Post Quest:** The poster creates a task/gig.
2. **Request:** A worker requests to take on the gig.
3. **Accept:** The poster accepts a specific worker's request.
4. **Reveal:** Contact information is revealed *only* to the involved parties.
5. **Complete:** The worker completes the task, and the poster verifies.

## Color System

- **Charcoal:** Text and primary dark elements
- **White:** Backgrounds and contrast text
- **Off White:** Secondary backgrounds and cards
- **Gray:** Borders, subtle elements, and secondary text
- **Green:** Primary action color / success states

## Logic & Gamification

- **Payment Tag Logic:** Tasks are labeled with standardized tags denoting expected compensation or conditions.
- **Karma Kredit:** Gamified reputation system. Karma Kredit is awarded *only* upon verifying task completion.

## Strict AI Constraints

- AI must restrict edits strictly to `src/components`, `src/pages`, and `src/utils`.
- The Supabase database and SQL schema are strictly off-limits. Never implement or drift toward database logic unprompted.
