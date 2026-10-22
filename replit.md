# Learn Think Build

Parent-guided AI literacy for learners ages 10+, with age-banded lessons, hands-on practice, mastery checks, and family accountability.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/curriculum test` — audit every age-band lesson, scene, activity, and question bank
- `pnpm --filter @workspace/api-server test` — grading, retakes, sequencing, pledges, projects, and legacy-credit regression checks
- `pnpm --filter @workspace/ai-explorer test` — all 63 activity versions plus all 63 full lesson component loops, including failed checks and retakes
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

- `artifacts/ai-explorer/src/` — React/Vite app, public pages and account routing.
- `artifacts/ai-explorer/src/learn/` — six-step lesson flow, narrated scenes, reusable activities, quizzes, mastery, review, skill map and learner hub.
- `artifacts/ai-explorer/src/family/` — guardian insights, discussion cards and rubric-based project approval.
- `lib/curriculum/src/` — shared canonical curriculum, age-band scripts, activity data, question banks, level projects and legacy ID aliases.
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
- Keep the phone/iOS-width navigation labels and order consistent with desktop. This is one responsive website, not a separate native iOS application.

## Gotchas

- Production schema changes are applied through Replit Publish; use the Drizzle push command only for the development database.
- Regenerate API hooks and Zod types after changing the OpenAPI contract.
- Phase 2 is intentionally deferred until Phase 1 works end to end.
- Mastery checks require 80% or higher. A failed retake must require review of missed lessons and draw a different question set.

## Curriculum and accountability

The shared curriculum contains 21 lessons in each of three age bands (63 versions), with three illustrated/narrated scenes and eight questions per version. Levels contain 5 / 5 / 6 / 5 lessons:

1. **AI Foundations / Engaging with AI:** patterns rather than personhood; next-token generation; hallucinations and evidence; synthetic media and voice cloning; privacy.
2. **Safe & Responsible Use / Managing AI:** AI companions and human support; bias; academic honesty; high-stakes decisions; scams and pressure.
3. **Prompt Craft / Creating with AI:** goal-context-format-limits; bounded prompts; follow-ups; tutoring without outsourcing thinking; source verification; creative credit.
4. **App Builder / Designing AI:** training versus inference and testing; a five-part app plan; small build iterations; edge cases and privacy; honest demonstration.

Age bands share skills, not identical scripts: 10–12 uses Pip and simpler wording with an estimated 11-minute lesson; 13–15 uses school/social situations and 14 minutes; 16+ uses deeper risk and design tradeoffs and 18 minutes. These are estimates for the whole loop, not required screen time. Every narrated scene stays short. All examples are simulations.

The loop is **Warm-up → Hook → Watch & Listen → Try It → Think → Check**. The first lesson skips retrieval; later lessons retrieve two earlier questions. Every narrated scene must be listened to or read in the transcript. Browser text-to-speech supplies narration, word-highlighted captions, replay, speed control and Read to me. The activity must produce completion evidence. Reflections must be the learner's own words. Five server-owned questions are sampled from a larger bank; 80% is required. The finish card suggests a break and a private family conversation.

Reusable activities cover next-word prediction, a pretend model and its missing-data failures, planted hallucinations plus verification, media provenance, privacy redaction, four-part prompt repair, appropriate-use sorting, branching choices, and an app-planning canvas.

Each new level requires both pledges. The next level needs all previous lessons, an 80% mastery result, and a guardian-approved project with three rubric checks. A failed mastery attempt records missed lessons; the learner must review them before a fresh attempt. Scores are calculated on the server using persisted quiz attempts, never trusted from a client-reported percentage. Personal bests, weekly goals, review sessions and badges reward understanding without streak pressure.

Canonical lesson IDs retain the ten original stored IDs. The aliases `ai-basics`, `clear-prompts`, and `check-answers` resolve to `what-is-ai`, `clear-instructions`, and `check-the-answer`. Credits are normalized without deleting historical records. Some equivalent old content now sits in its correct level; that credit is retained, while new lessons still need completion.

## QA and bug-fix pass — 2026-10-22

### Broken or incomplete behavior found and repaired

- The previous curriculum had only ten lessons, fixed short checks and missing topics. It now has complete content for the 21-lesson path in all three bands, including question banks and family prompts.
- “Try It” previously accepted a generic notes/checklist submission rather than a real game. Nine reusable interactive activity types now require an appropriate completed response.
- The monolithic lesson and assessment pages were replaced with focused step, speech, activity and quiz components. Forward progress requires the scene/activity/reflection gates; narration is cancelled when leaving a step/page or hiding the tab.
- Mastery used a fixed answer array, and the lesson API accepted a client-reported score. Quizzes now use persisted, learner-owned random attempts and server grading, with explanations and fresh retakes.
- Server progression previously checked mastery without enforcing guardian project approval. New progression validates lesson sequence, both pledges, previous lessons, mastery, and project approval. Project edits invalidate prior approval.
- Legacy learning-state rows could omit the learner pledge field. Responses now normalize defaults rather than failing validation.
- Legacy lesson aliases could create wrong counts or mismatched lesson routes. Canonical normalization preserves credit; historical completions remain reviewable.
- Guardian visibility was incomplete. The dashboard now has saved reflections, discussion actions, weekly goal controls, time, scores, project rubrics, review results, skills and badges.
- Missing-route feedback is now actionable, with Home, Family account and Sign in links. Invalid learner IDs return a readable error rather than a PostgreSQL UUID failure.
- The legacy `/dashboard` URL now redirects to the family dashboard.
- The browser pass found severely cramped phone learner cards, a missing age-picker stylesheet, clipped navigation, and an intrinsic-width sign-up form. The picker now imports its own styles; phone card actions stack, grid tracks shrink safely, all four nav tabs are visible, and auth sizing uses app-owned Clerk appearance classes. Auth colors and logo now match the website.
- A global 320px body minimum caused horizontal scrolling in a 320px browser with a 15px vertical scrollbar. The body now uses the actual available width rather than forcing an extra 15px; overflow is not merely hidden.
- The Check introduction incorrectly promised four questions while rendering five. It now consistently says five.
- Random sampling could produce a retake containing only multiple-choice questions. Full lesson/mastery/review checks now deliberately include retrieval, a scenario, and an ordering/sorting question while varying the remaining questions.
- Watch's Pause control previously cancelled speech and restarted at the beginning. It now pauses/resumes the current utterance, while leaving/hiding the page cancels it.
- Alias/canonical duplicate records now preserve the first completion date, total time, discussion status, and best score instead of arbitrarily choosing a row. Discussion marking also finds legacy alias rows.
- Stale tabs could overwrite the full pledge/project state. State saves now use a revision and atomic compare-and-swap; conflicts refetch the current state and give a readable retry message.
- A second pre-opened mastery attempt can no longer bypass missed-lesson review. Attempt submission is serialized per learner and rechecks outstanding review requirements.
- Expired, already-used, or invalidated quiz attempts previously left the UI stuck on an unusable submission. Lesson, mastery, and review screens now let the learner start a fresh check without discarding the current reflection.
- Guardian weak-topic summaries now include missed topics from recent failed checks, rather than only scores on already-completed lessons.
- Privacy Redactor previously kept completion enabled after the learner revealed a private detail again. Changing a redaction now invalidates the old completion evidence.
- The prompt/app-plan privacy heuristic previously rejected harmless rules such as “never include passwords.” It now recognizes concrete secret assignments without rejecting the word in safety instructions; email, phone and address checks remain.
- Sorting activities originally offered category buttons only. They now also support native card-to-category dragging, validate the source item, reject incorrect/foreign drops, and keep the same keyboard/touch button alternative.
- Sorting evidence previously double-counted successful classifications. It now records the actual attempts, including wrong classifications.
- An 80% passing lesson check previously went straight to its finish card without explaining the missed answer. The finish card now explains it, offers Read to me, and requires a correct practice retry before its continue links appear. The server still awards eligibility and score; client-side comparison is used only for this extra practice.
- Type checking caught optional HTTP status values in the expired-attempt recovery handlers; all three handlers now safely handle missing status values.
- API failures now return structured JSON instead of an unexplained HTML server error.
- Public curriculum/how-it-works copy now describes the actual loop and four levels, while pricing remains $9.99/month coming soon and testimonials remain honest.

### Automated verification

- `pnpm --filter @workspace/curriculum test`: 65 passing content/coverage checks.
- `pnpm --filter @workspace/api-server test`: 9 learning-rule tests, including grading/retakes for all 63 banks and mixed-format coverage across all 12 age-band levels.
- `pnpm --filter @workspace/ai-explorer test`: 126 passing component tests: each of 63 activities rejects incomplete/unsafe inputs and produces valid evidence, including wrong/foreign/correct drag events in every classifier; each of 63 lesson loops runs warm-up where applicable, Hook, transcript viewing, Try, original reflection, an intentional failed quiz, a fresh passing retake, and the family/break finish card. The first lesson in each band additionally passes at 80%, explains its miss, and gates continuing until the practice retry is correct. These use Happy DOM with a simulated HTTP boundary and real grading functions; they are not live-browser or authenticated production tests. Narration capability is simulated, not audible audio.
- `PORT=23936 BASE_PATH=/ pnpm run build`: full workspace typecheck and all production builds pass.
- Development schema was extended additively with server-owned `quiz_attempts`; no existing family/progress table was dropped or reset.

### Browser coverage and limitations

- All 63 lesson versions completed against the real preview API on desktop: all 21 lessons in each of the three age bands. All three QA learners reached 21/21 lessons and 4/4 levels with four guardian-approved projects and passing mastery checks.
- The 16+ Level 1 mastery check failed intentionally at 60%, required review of both missed lessons, then passed at 100% on a fresh five-question attempt.
- A project could not be approved before mastery; all three guardian rubric checks were required. Project approval alone and a learner pledge alone did not open Level 2; both new-level signatures were required.
- Add/remove learner, all three age bands, reflections, discussion marking and reload persistence, weekly review, badges, personal bests, and changing one learner's weekly goal without changing the others were verified.
- The latest phone measurements show `scrollWidth === clientWidth` on family and lesson pages: 305px available at a 320px viewport and 375px at 390px. The 15px difference is the browser's vertical-scrollbar gutter. Age choices and all four tabs fit. The lesson step control may scroll internally; the page does not overflow.
- All four public navigation destinations, $9.99/month coming-soon pricing, honest Testimonials, the old sample-feedback redirect, custom 404 and recovery links, invalid learner route, sign-out, signed-out family protection, dashboard redirect, and the `ai-basics` alias were exercised.
- Authenticated preview sign-in used Clerk's development QA helper. Real production sign-in and physical-iPhone speech/OAuth behavior were not verified. Headless speech did not produce audible output; transcript completion and cancellation when navigating away were verified.
- A partial Level 2 lesson initially returned to Warm-up during development Vite reconnection/source updates. A subsequent stable continuation completed that lesson and all remaining desktop lessons. Keep source/workflow updates paused during browser coverage to avoid confusing hot reload with a production defect.
- The initial preview 502 coincided with stopped managed workflows; both app workflows were restored. No later app-console exception was captured in the completed account/navigation pass. Expected development notices include Clerk development-key limits, React/Vite information, and Clerk's autocomplete suggestion.
- Native drag was verified in the desktop browser: wrong category rejected, correct drop accepted, and category-button fallback worked. Finish remained unavailable until every item was correct.
- An intentional 80% revisit was verified in the desktop browser: the miss was explained with Read to me, wrong practice kept continue links hidden, and a correct retry exposed them. The original completion date, 100% personal best, 21/21 lessons and 4/4 levels were preserved; only session time increased.
- During the long desktop run one preview QA session lost authentication and received a handled 401/sign-in redirect before quiz submission. Restoring the permitted preview-only helper allowed completion; the interrupted attempt remained unfinished rather than gaining false credit. This does not verify or diagnose real production sign-in.
- All 126 real-browser lesson/viewport combinations passed: 63 age-band lesson versions at desktop 1280px and the same 63 at phone 390px. Each passed cell reached a saved Talk it Over and Take a break card. The earlier partial cells were resumed, not silently counted as complete.
- Fresh phone-only setup/accountability coverage passed: add a temporary learner with display name and age band only, both initial pledges, five Level 1 lessons, intentional 60% mastery failure, required missed-lesson reviews, a fresh 100% retake, guardian rubric/approval, and both new-level pledge gates. The temporary learner was deleted with confirmation; the three original QA learners remained intact.
- Phone discussion marking persisted after reload. A phone weekly-goal change affected only the selected learner, and restoring it persisted. A phone weekly mixed review saved at 100% with its review badges while earned lesson counts stayed at 21.
- The 16+ phone 80% pass also required a corrected practice answer before continuing. Its 320px review layout measured document/body client and scroll widths at 305/305; at 390px they were 375/375. Watch, Try and Check in the content-heavy Prompt Craft and App Builder lessons, including the final four App Builder lessons, measured 375/375 with controls in bounds. The step navigator may scroll internally; the document did not overflow in these measured states.
- Final readbacks confirmed exactly three original profiles, 21 distinct earned lesson rows each (63 total), four mastery rows each, 100% saved personal bests, unchanged earliest completion/graduation timestamps, and isolated weekly goals. Intentional failed/80% attempts remained in history without lowering earned bests. The QA browser was explicitly signed out to public Home.
- The full workspace typecheck and production build passed after the final app-source changes. All 200 automated tests passed (65 curriculum, 9 server-rule, 126 component). Remaining build output is a non-failing JavaScript chunk-size advisory; development Clerk/preload/autocomplete notices are not app exceptions.
- Published asset filenames were compared with the current production build and differed: the updated build has not yet been published. Live autoscale logs showed brief readiness failures before the API port opened, then a successful `/api/healthz` response; no persistent production health failure was established.
- Final live-domain checks: `/`, `/sign-in`, `/api/healthz`, and `/api/__clerk/v1/environment` returned 200; anonymous `/api/family` correctly returned 401. The live asset filenames still differ from the new build. These checks do not prove authenticated production account creation/linking or family APIs; the preview-only QA helper must not be used as production-auth evidence.
- The final 390px Home capture rendered correctly with all four navigation tabs. Its headless browser logged experimental/unavailable WebGPU-context warnings in addition to the expected development Clerk notice; no page failure or app exception accompanied them. Physical-iPhone OAuth and audible narration remain unverified.

### Live-domain verification and publishing boundary

The current published domain was confirmed through deployment metadata as `https://learnthinkbuild.com`. Live requests returned 200 for `/`, `/sign-in`, `/api/healthz` and `/api/__clerk/v1/environment`; `/api/family` correctly returned 401 without a session. These checks establish routing, health, the Clerk proxy and the signed-out API boundary—not successful authenticated production use.

The published site continues to serve its previous build until the owner clicks Publish. Managed Clerk production users are separate from development test users. Never claim that a programmatic preview test proves a real production sign-in, and never enable testing claim overrides on the live site. The pre-publish schema diff reports a new quiz-attempt table/index/foreign key and missing additive columns for age bands, learning state, reflections, duration, scores and discussion status; it reports no structural data loss or backwards-compatibility warning. Apply these changes through Publish before serving the new experience.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
