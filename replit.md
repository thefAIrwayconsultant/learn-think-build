# Learn Think Build

Parent-guided AI literacy for learners ages 10+, with age-banded lessons, hands-on practice, mastery checks, and family accountability.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/curriculum test` — audit every age-band lesson, scene, activity, and question bank
- `pnpm --filter @workspace/api-server test` — grading, retakes, sequencing, pledges, projects, and legacy-credit regression checks
- `pnpm --filter @workspace/ai-explorer test` — all 240 activity versions and 240 full lesson component loops, including failed checks and retakes
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
- `artifacts/ai-explorer/src/learn/` — six-step, ten-minute lessons; narrated scenes; reusable interactive demos; quizzes; chapter mastery; review; skill map; daily time gate; learner hub.
- `artifacts/ai-explorer/src/family/` — guardian insights, discussion cards and rubric-based project approval.
- `lib/curriculum/src/` — four 20-session chapters, three age-band versions, activity data, question banks, chapter projects and legacy ID aliases.
- `artifacts/api-server/src/routes/family.ts` — guardian-owned profiles, learner progress, and family API.
- `lib/db/src/schema/families.ts` — PostgreSQL source of truth for guardians, child profiles, progress, mastery, and server-owned daily learning time.
- `lib/api-spec/openapi.yaml` — API contract source of truth; regenerate clients and Zod validators with the codegen command above.
- `artifacts/ai-explorer/src/Mascot.tsx` — Pip mascot.

## Architecture decisions

- Learner accounts remain guardian-owned; learner profiles store only display name and broad age band. Never add birth dates or learner email addresses.
- Keep AI examples simulated in lessons; do not add an open-ended live learner chatbot.
- Preserve old lesson completions by mapping legacy lesson IDs to their equivalent lessons in the revised curriculum. Do not delete or reset progress during curriculum changes.
- The four sequential chapters are Meet the AIs, Prompting Power, When to Use AI (and When Not To), and When to Trust AI (and When Not To). Each contains 20 daily sessions.
- Enforce lesson completion requirements and guardian project approval before unlocking the next chapter; do not rely on lesson-card navigation alone.

## Product

- Parent-led, at-home AI education for learners 10+.
- Speak to curious school-aged kids and their parents. Help children discover how AI works, build useful skills gradually, and get excited to make things safely as an alternative to passive screen time. Keep the tone playful, imaginative, and parent-trusted, not school-sales or job-training marketing.
- Make lessons increasingly detailed by age and prior mastery. Use game-inspired challenges, visible progress, mastery scores, personal bests, and badges to reward understanding and creation—not speed, pressure streaks, or time spent online. Describe game features only when they are implemented.
- Three age paths: 10–12 Curious Starter, 13–15 Thoughtful Explorer, and 16+ Independent Builder. Teach the same core skills with age-adjusted language, examples, pacing, and depth.
- Each lesson uses the six-step loop: Warm-up, Hook, Watch & Listen, Try It, Think, and Check. Lessons combine narration, visuals, interaction, retrieval, reflection, and spaced review; never match learners to a single “learning style.”
- Each chapter has 20 distinct, age-adjusted daily sessions, designed for about one month of 10-minute lessons. A server-owned rolling 24-hour timer allows at most 600 active learner seconds per profile across tabs/devices; hiding or leaving the learner experience pauses it. Family pages are outside the limit. Show a gentle one-minute warning and stop the lesson experience when time runs out; never use a streak.
- Keep every activity simulated and self-contained. Give all three age bands distinct scripts, scenarios, and mixed question banks while keeping the same core concept.
- Lesson completion requires the explainer/transcript, hands-on activity, a non-empty learner reflection, and an 80%+ mixed check. Each lesson ends with a family Talk it Over card.
- Weekly goals are supportive, not streak-based. Guardians can review learner progress, reflections, project submissions, discussion cards, pledge status, and goal progress.
- Real AI tools are not available to learners; future access must be adult-approved and supervised.

## User preferences

### Sign-up and sign-in presentation

- Refreshed the existing Clerk screens with one form panel instead of a nested tinted frame, consistent blue branding, clear input borders/focus states, 48px+ controls, readable button contrast, and 16px input text to avoid iPhone focus zoom.
- Consolidated conflicting responsive auth styles and removed the duplicate in-form brand logo. The site header still links home. Footer links wrap as complete words on narrow screens.
- Corrected the Tailwind/Clerk production stylesheet build configuration. Authentication keys, proxy, routes, provider choices, session transport, and verification behavior were not changed.
- Visually checked signup at 320px, 390px, and 1280px, plus sign-in at 390px. Web typecheck and production build passed; workflow startup was clean. Real production account creation/OAuth and physical-iPhone interaction were not retested as part of this appearance-only change.
- The previously inspected live page had a multi-price offer and a Sample feedback link. The current single family offer is $4.99/month, marked coming soon; publish the updated build to replace the older live page.

### Product scope

- Keep learning intuitive while holding learners accountable.
- Do not market the product for school sales; focus on parents introducing AI at home.
- Position the app as a safe AI jumpstart for curious children: introduce the basics now and gradually build practical skills for future study and work. AI literacy is becoming table stakes in today's business world; do not promise employment or replace age-appropriate learning with job-training pressure.
- Publish only genuine family testimonials with permission. Do not invent reviews.
- The single family price is $4.99/month; keep it labeled “coming soon” until Stripe billing is enabled. Do not show other plan or price amounts.
- Keep the phone/iOS-width navigation labels and order consistent with desktop. This is one responsive website, not a separate native iOS application.

## Gotchas

- Production schema changes are applied through Replit Publish; use the Drizzle push command only for the development database.
- Regenerate API hooks and Zod types after changing the OpenAPI contract.
- Phase 2 is intentionally deferred until Phase 1 works end to end.
- Mastery checks require 80% or higher. A failed retake must require review of missed lessons and draw a different question set.

## Curriculum and accountability

The shared curriculum has four chapters of 20 daily missions (80 core sessions; 240 age-banded versions). Each session is about 10 minutes, with three narrated scenes, an interactive demonstration, and a larger question bank. The chapter sequence is:

1. **Meet the AIs:** chatbots/language models, image generators, recommendations, voice assistants, computer vision, game AI, robotics and self-driving; compare inputs, data, patterns and purposes.
2. **Prompting Power:** goal, context, format, limits, follow-ups, iteration, examples, role prompts, and repair of vague prompts.
3. **When to Use AI (and When Not To):** low-risk exploration, homework honesty, creativity and original thinking, privacy, AI companions versus real people, and decisions needing a human.
4. **When to Trust AI (and When Not To):** hallucinations, exact-claim source checks, bias, deepfakes and voice clones, scams, pressure tactics, high-stakes decisions and trusted adults.

Each learner age band shares core skills but uses different scripts, scenarios, vocabulary, and question banks: 10–12 uses Pip and simpler wording; 13–15 uses realistic peer and online situations; 16+ explores deeper systems, evidence, and tradeoffs. All sessions estimate 10 minutes. The learner gets 600 active seconds in a rolling 24-hour window; a server-owned heartbeat and session IDs track active tabs together. Hiding or leaving the learner path pauses usage, and a browser that cannot verify its timer fails closed. The parent dashboard is not timed.

The loop is **Warm-up → Hook → Watch & Listen → Try It → Think → Check**. The first lesson has no warm-up; later sessions retrieve two earlier questions. Every narrated scene must be played or read in the transcript. Browser text-to-speech supplies narration, word-highlighted captions, replay, speed control and Read to me. The activity must produce completion evidence. Reflections must be the learner's own words. Five server-owned questions are sampled from a larger bank; 80% is required. The finish card suggests a break, a family conversation, and returning tomorrow without a streak.

Interactive simulations include next-word probabilities, model training and missing-data failures, claim verification, media inspection, privacy redaction, prompt repair, use/risk sorting, branching scenarios, and an app-planning canvas. Every chapter ends with a project and an 80% mastery check. The guardian reviews each project against three criteria before the next chapter opens. Both guardian and learner renew the safety pledge at each chapter. A failed mastery attempt records missed lessons; those lessons must be reviewed before fresh questions are served. Scores are calculated on the server using persisted quiz attempts, never trusted from a client-reported percentage. Personal bests, weekly goals, review sessions and badges reward learning without streak pressure.

The leaderboard is private to one guardian-owned family account; never create public or cross-family rankings. Learning points are derived from completed missions, each mission’s best quiz score, chapter mastery and the best weekly review. Retakes can improve a personal best but cannot farm repeat points. Do not award points for time spent or streaks.

All 21 historical lesson IDs stay in their corresponding new chapter, and aliases `ai-basics`, `clear-prompts`, and `check-answers` still resolve to their canonical lesson IDs. Existing completion dates, reflections, scores, time and discussion status remain preserved. Old mastery scores and chapter project submissions stay visible as historical records but cannot bypass the new 20-session chapter gates.

## QA and bug-fix pass — 2026-10-22

### Broken or incomplete behavior found and repaired

- The previous curriculum had fewer lessons, fixed short checks and missing topics. It now has 80 complete daily sessions in all three age bands, with age-specific narration, questions, activities, and family prompts.
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
- Public curriculum/how-it-works copy now describes the actual loop, four monthly chapters, and active 10-minute limit. The only displayed family price is $4.99/month coming soon; testimonials contain no fabricated quotes.

### Current rebuild fixes

- The former short, shallow path was replaced with four 20-session chapters and age-specific content for all three learner bands; legacy lesson IDs and saved progress continue to resolve.
- Marketing had outdated multi-price plans and placeholder feedback. It now uses one `$4.99/month` coming-soon family price, curiosity-led copy, and no fabricated testimonials.
- The learning experience previously had no shared 10-minute daily cap. A server-owned rolling-window ledger now gates the learner routes and accounts for concurrent sessions, while leaving the guardian dashboard available.
- Kids and guardians now see a private family leaderboard with server-derived learning points. Points reward completed missions, best quiz scores, chapter mastery and best weekly review; time, streaks and repeat attempts earn no points.
- The root production build previously failed because Vite artifact builds had no `PORT`/`BASE_PATH`. The root build now supplies each artifact’s registered values, and the full build succeeds.

### Automated verification

- Current rebuild: `pnpm --filter @workspace/curriculum test` — 242 checks passed, including all 80 sessions, age variants, durations, and legacy-credit mapping.
- Current rebuild: `pnpm --filter @workspace/api-server test` — 11 tests passed, including score calculations, rolling 24-hour accounting, multiple active sessions, and chapter progression gates.
- Current rebuild: `pnpm --filter @workspace/ai-explorer test` — all 481 tests passed, covering 240 activities, 240 complete lesson loops across the three age bands, and family leaderboard ranking/privacy copy. Lesson tests use Happy DOM with a simulated HTTP boundary; they do not prove authenticated production use or audible speech.
- Current rebuild: `pnpm run typecheck` and `pnpm run build` both pass. The root build supplies per-artifact `PORT`/`BASE_PATH` values so each app builds at its registered path. Vite reports a non-failing 596 kB client JavaScript chunk advisory.
- Development schema was extended additively with server-owned `quiz_attempts` and `child_daily_learning`; no existing family/progress table was dropped or reset.

### Current rebuild browser check

- Signed-out landing page screenshots at 390px and 1440px showed the new child-curiosity positioning and no visible horizontal overflow. The latest browser check did not sign in, so authenticated dashboard, add/remove learner, timer countdown, and live-domain behavior were not re-verified in this pass.
- Browser logs had the expected Clerk development-key notice, React DevTools info, and a non-fatal experimental/unavailable WebGPU-context warning. No app exception appeared. The source contains no WebGPU usage; the warning did not affect rendering.
- API `/api/healthz` returned 200. The daily-usage route requires a real guardian-owned learner; a request for a nonexistent learner was rejected, not used as authenticated timer evidence.
- A repository-wide search found no prior family price amounts; the app’s single price constant is `$4.99`. Billing remains “coming soon.”
- The new development daily-time table has not been applied to production. Publish is required before the production app can enforce the 10-minute cap.
- For the reported Google sign-in followed by blocked lesson access, recent production logs show successful OAuth/session requests and no learner lesson-route errors, but cannot identify the reporting user or their family setup. Preview sign-in now falls back to the family dashboard; when the guardian pledge is pending, the learner page provides a direct link to family approval. This fix has not yet been published or verified with the owner’s production account.

### Browser coverage and limitations

The remaining detailed browser records below are from the prior curriculum, before the current 80-session redesign; they document previous behavior, not current post-redesign authenticated verification.

- Earlier curriculum QA: all 63 then-current lesson versions completed against the real preview API; three QA learners reached the prior 21/21 lesson path and four mastery gates.
- The 16+ Level 1 mastery check failed intentionally at 60%, required review of both missed lessons, then passed at 100% on a fresh five-question attempt.
- A project could not be approved before mastery; all three guardian rubric checks were required. Project approval alone and a learner pledge alone did not open Level 2; both new-level signatures were required.
- Add/remove learner, all three age bands, reflections, discussion marking and reload persistence, weekly review, badges, personal bests, and changing one learner's weekly goal without changing the others were verified.
- The latest phone measurements show `scrollWidth === clientWidth` on family and lesson pages: 305px available at a 320px viewport and 375px at 390px. The 15px difference is the browser's vertical-scrollbar gutter. Age choices and all four tabs fit. The lesson step control may scroll internally; the page does not overflow.
- All four public navigation destinations, family pricing and coming-soon state, honest Testimonials, the old sample-feedback redirect, custom 404 and recovery links, invalid learner route, sign-out, signed-out family protection, dashboard redirect, and the `ai-basics` alias were exercised.
- Authenticated preview sign-in used Clerk's development QA helper. Real production sign-in and physical-iPhone speech/OAuth behavior were not verified. Headless speech did not produce audible output; transcript completion and cancellation when navigating away were verified.
- A partial Level 2 lesson initially returned to Warm-up during development Vite reconnection/source updates. A subsequent stable continuation completed that lesson and all remaining desktop lessons. Keep source/workflow updates paused during browser coverage to avoid confusing hot reload with a production defect.
- The initial preview 502 coincided with stopped managed workflows; both app workflows were restored. No later app-console exception was captured in the completed account/navigation pass. Expected development notices include Clerk development-key limits, React/Vite information, and Clerk's autocomplete suggestion.
- Native drag was verified in the desktop browser: wrong category rejected, correct drop accepted, and category-button fallback worked. Finish remained unavailable until every item was correct.
- Earlier curriculum QA: an intentional 80% revisit explained misses with Read to me, required a corrected answer before continuing, and retained the saved completion date and best score.
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

The owner published the curriculum rebuild after the previous preview-only checks; the later sign-in fallback and guardian-approval link are still preview-only and require another owner-initiated Publish. Managed Clerk production users are separate from development test users. Never claim that a programmatic preview test proves a real production sign-in, and never enable testing claim overrides on the live site. The pre-publish schema diff reports a new quiz-attempt table/index/foreign key and missing additive columns for age bands, learning state, reflections, duration, scores and discussion status; it reports no structural data loss or backwards-compatibility warning.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
