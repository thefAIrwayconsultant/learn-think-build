# Learn Think Build

Parent-guided AI literacy for learners ages 10+, with age-banded lessons, hands-on practice, mastery checks, and family accountability.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-explorer/src/` — React/Vite app, learner experience, guardian dashboard, lesson content and styles.
- `artifacts/api-server/src/routes/family.ts` — guardian-owned profiles, learner progress, and family API.
- `lib/db/src/schema/families.ts` — PostgreSQL source of truth for guardians, child profiles, progress, and mastery.
- `lib/api-spec/openapi.yaml` — API contract source of truth; regenerate clients and Zod validators with the codegen command above.
- `artifacts/ai-explorer/src/Mascot.tsx` — Pip mascot.

## Architecture decisions

- Learner accounts remain guardian-owned; learner profiles store only display name and broad age band. Never add birth dates or learner email addresses.
- Keep AI examples simulated in lessons; do not add an open-ended live learner chatbot.
- Preserve old lesson completions by mapping legacy lesson IDs to their equivalent lessons in the revised curriculum. Do not delete or reset progress during curriculum changes.
- The four mastery levels remain sequential: AI Foundations (Engaging with AI), Safe & Responsible Use (Managing AI), Prompt Craft (Creating with AI), and App Builder (Designing AI).
- Enforce lesson completion requirements and guardian approval before unlocking the next level; do not rely on lesson-card navigation alone.

## Product

- Parent-led, at-home AI education for learners 10+.
- The goal is to help children safely teach themselves AI skills they will need in the real world, building ability gradually through age-appropriate lessons and playful progress. Position it as a creative alternative to passive screen time: help children want to make and build with AI safely, not only consume content.
- Make lessons increasingly detailed by age and prior mastery. Use game-inspired challenges, visible progress, mastery scores, personal bests, and badges to reward understanding and creation—not speed, pressure streaks, or time spent online. Do not advertise high scores, badges, or other game features as available until they are implemented.
- Three age paths: 10–12 Curious Starter, 13–15 Thoughtful Explorer, and 16+ Independent Builder. Teach the same core skills with age-adjusted language, examples, pacing, and depth.
- Each lesson uses a consistent six-step loop: Warm-up, Hook, Watch & Listen, Try It, Think, and Check. Lessons combine narration with synchronized visuals, interaction, retrieval practice, reflection, and spaced review; never match learners to a single “learning style.”
- Lesson completion requires the explainer/transcript, hands-on activity, a non-empty learner reflection, and an 80%+ mixed check. Each lesson ends with a family Talk it Over card.
- Weekly goals are supportive, not streak-based. Guardians can review learner progress, reflections, project submissions, discussion cards, pledge status, and goal progress.
- Real AI tools are not available to learners; future access must be adult-approved and supervised.

## User preferences

- Keep learning intuitive while holding learners accountable.
- Do not market the product for school sales; focus on parents introducing AI at home.
- Publish only genuine family testimonials with permission. Do not invent reviews.
- Keep the $9.99/month family price visible as “coming soon” until billing is enabled.

## Gotchas

- Production schema changes are applied through Replit Publish; use the Drizzle push command only for the development database.
- Regenerate API hooks and Zod types after changing the OpenAPI contract.
- Phase 2 is intentionally deferred until Phase 1 works end to end.
- Mastery checks require 80% or higher. A failed retake must require review of missed lessons and draw a different question set.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
