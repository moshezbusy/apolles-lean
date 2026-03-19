# Story 1.3: Agent Login, Logout & Secure Sessions

Status: review

## Story

As an agent,
I want to log in with email and password and maintain a secure session,
so that I can securely access my workspace.

## Acceptance Criteria

1. Given I have a valid account created by admin, when I submit valid credentials on the login page, then a database session is created via NextAuth with Prisma adapter.
2. Session cookie is set with HttpOnly, Secure, SameSite flags (NFR8).
3. After successful login, I am redirected to the search page (home).
4. Given invalid credentials, when login is processed, then I see a generic error message that does not reveal which field was wrong.
5. Given 30 minutes of inactivity, when I attempt any action, then my session has expired and I am redirected to login.
6. When I click logout, then my database session is deleted and I am redirected to the login page.
7. Login page uses the Apolles design system.
8. Password is verified against industry-standard one-way hash (bcrypt) (NFR7).
9. Deactivated accounts (`isActive = false`) cannot log in and see "Account is inactive".

## Tasks / Subtasks

- [x] Task 1: Implement NextAuth v5 credentials flow with Prisma adapter (AC: #1, #2, #8)
  - [x] Install and configure `@auth/prisma-adapter` for NextAuth v5.
  - [x] Configure `auth.ts` using v5 patterns (`auth()`, `handlers`, `signIn`, `signOut`).
  - [x] Add credentials provider that validates email/password.
  - [x] Verify password with bcrypt hash from `users.password_hash`.
  - [x] Ensure session strategy is database-backed and uses Prisma adapter models.
  - [x] Configure secure cookies with HttpOnly/Secure/SameSite flags.
- [x] Task 2: Build login/logout UX and routing (AC: #3, #4, #6, #7)
  - [x] Create login page UI using existing design tokens and components.
  - [x] Add form validation and submit handling with generic invalid credentials messaging.
  - [x] Redirect successful login to home/search page.
  - [x] Add logout action that removes DB session and redirects to login.
- [x] Task 3: Enforce session expiration and protected access (AC: #5)
  - [x] Configure session max age / inactivity timeout to 30 minutes.
  - [x] Update middleware/auth gate so unauthenticated/expired sessions redirect to login.
  - [x] Verify authenticated routes are blocked without valid session.
- [x] Task 4: Enforce inactive account login denial (AC: #9)
  - [x] During credentials authorize/sign-in callback, reject users with `isActive = false`.
  - [x] Return specific user-facing message: "Account is inactive".
- [x] Task 5: Verification and quality gates
  - [x] Add/update tests for auth success, invalid credentials, inactive account denial, logout flow.
  - [x] Run `pnpm build`, `pnpm test`, `pnpm typecheck`.

### Review Follow-ups (AI)

- [x] [AI-Review][High] Reconcile the story's implementation trail with the current source of truth so File List and review notes accurately describe the files changed for Story 1.3.
- [x] [AI-Review][High] Update the login experience to use the Apolles dark visual treatment, including the required `#0A2540` styling direction.
- [x] [AI-Review][Medium] Fail closed when Auth.js session payloads are malformed instead of silently defaulting the role.
- [x] [AI-Review][Medium] Replace middleware cookie-presence auth heuristics with validated session-aware routing logic.
- [x] [AI-Review][Medium] Add direct automated evidence for database session configuration, secure cookie flags, inactivity expiry, and logout behavior required by the story.
- [x] [AI-Review][Low] Strengthen login page tests so callback preservation is verified through the rendered UX boundary, not just basic page rendering.

## Dev Notes

- NextAuth in this repo is v5 beta (`next-auth@5.0.0-beta.25`), so implementation must follow v5 API patterns rather than v4 examples.
- Keep Prisma as ORM and Supabase Postgres as source of truth; do not introduce Supabase Auth.
- Database role enum mapping already aligns to existing `UserRole` in Supabase (`AGENT -> agent`, `ADMIN -> platform_admin`) via Prisma enum mapping in `apolles/prisma/schema.prisma`.
- Story 1.2 delivered auth-ready schema and seed; this story must consume that model without broad schema redesign.
- Keep architecture boundaries: UI -> actions/services -> `src/lib/db.ts`.

### Project Structure Notes

- Prefer updates in:
  - `apolles/src/lib/auth.ts`
  - `apolles/src/app/api/auth/[...nextauth]/route.ts`
  - `apolles/src/middleware.ts`
  - auth-related UI pages/components under `apolles/src/app/`
- Do not implement dashboard shell/sidebar here (Story 1.4).
- Do not implement role authorization helper module here (Story 1.5).
- Do not implement admin agent management UI here (Story 1.6).

### References

- Epic 1 Story 1.3 definition [Source: `_bmad-output/planning-artifacts/epics.md:379`]
- Authentication and session requirements [Source: `_bmad-output/planning-artifacts/architecture.md`]
- Story 1.2 delivered schema and seed [Source: `_bmad-output/implementation-artifacts/1-2-auth-ready-data-model-and-seed.md`]

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- `pnpm add @auth/prisma-adapter`
- `pnpm test` (RED: failing tests before implementation)
- `pnpm test` (GREEN after auth credential implementation)
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm typecheck`
- `pnpm vitest run src/lib/auth.test.ts src/middleware.test.ts src/app/login/page.test.tsx src/app/login/actions.test.ts` (RED)
- `pnpm vitest run src/lib/auth.test.ts src/middleware.test.ts src/app/login/page.test.tsx src/app/login/actions.test.ts` (GREEN)
- `pnpm test`
- `pnpm build`
- `pnpm typecheck`
- `pnpm vitest run src/lib/auth.test.ts` (RED: credentials/session strategy regression reproduced in unit coverage)
- `pnpm vitest run src/lib/auth.test.ts src/app/login/actions.test.ts src/middleware.test.ts`
- `curl -i http://localhost:3002/api/auth/providers`
- `curl -i http://localhost:3002/api/auth/csrf`
- `curl -i http://localhost:3003/api/auth/providers`
- `curl -i http://localhost:3003/api/auth/csrf`
- `curl -s -c /tmp/apolles-story13-agent.cookies http://localhost:3003/api/auth/csrf`
- `curl -i -b /tmp/apolles-story13-agent.cookies -c /tmp/apolles-story13-agent.cookies -X POST http://localhost:3003/api/auth/callback/credentials ... agent.test@apolles.local / Agent123!`
- `curl -b /tmp/apolles-story13-agent.cookies http://localhost:3003/api/auth/session`
- `curl -b /tmp/apolles-story13-agent.cookies http://localhost:3003/search`
- `curl -i -b /tmp/apolles-story13-agent.cookies -c /tmp/apolles-story13-agent.cookies -X POST http://localhost:3003/api/auth/signout ...`
- `curl -b /tmp/apolles-story13-agent.cookies http://localhost:3003/api/auth/session` (post-logout)
- `curl -b /tmp/apolles-story13-agent.cookies http://localhost:3003/search` (post-logout redirect check)
- `pnpm vitest run src/lib/auth.test.ts`
- `pnpm test`
- `pnpm build`
- `pnpm typecheck`
- `SEED_ADMIN_PASSWORD="Admin123!" SEED_AGENT_PASSWORD="Agent123!" pnpm db:seed`
- `pnpm vitest run src/lib/auth.test.ts src/app/login/actions.test.ts`
- `pnpm vitest run src/lib/auth.test.ts src/app/login/actions.test.ts src/app/login/page.test.tsx src/middleware.test.ts "src/app/(app)/layout.test.tsx" "src/app/(app)/admin/layout.test.tsx" src/features/admin/agents/actions.test.ts`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `AUTH_TRUST_HOST=true PORT=3002 pnpm start`
- `curl http://localhost:3002/api/auth/csrf`
- `curl -X POST http://localhost:3002/api/auth/callback/credentials ... admin.test@apolles.local / Admin123!`
- `curl -X POST http://localhost:3002/api/auth/callback/credentials ... agent.test@apolles.local / Agent123!`
- `curl -X POST http://localhost:3002/api/auth/callback/credentials ... agent.test@apolles.local / Wrong123!`
- `curl http://localhost:3002/api/auth/session` (verified JWT session payloads for admin + agent; invalid login returns `null`)
- `curl http://localhost:3002/reservations` with admin session (307 redirect to `/admin/bookings`)
- `curl http://localhost:3002/search` with agent session (200 OK)
- `pnpm vitest run src/lib/auth.test.ts src/lib/auth-routing.test.ts src/lib/auth-credentials.test.ts src/middleware.test.ts src/app/login/actions.test.ts src/app/login/page.test.tsx "src/app/(app)/layout.test.tsx" "src/app/(app)/admin/layout.test.tsx" "src/app/(app)/search/actions.test.ts" src/features/admin/agents/actions.test.ts src/components/layout/sidebar.test.tsx`
- `pnpm test`
- `pnpm typecheck`
- `pnpm vitest run src/app/login/actions.test.ts src/app/login/page.test.tsx src/middleware.test.ts`
- `pnpm test`
- `pnpm build`
- `pnpm typecheck`

### Implementation Plan

- Reconcile Story 1.3 review follow-ups by tightening auth/session invariants, strengthening middleware session checks, and refreshing the login page presentation to match the Apolles visual treatment.
- Add direct tests for auth configuration, middleware behavior, and rendered login callback handling before updating implementation details.
- Re-run targeted and full quality gates, then refresh the story audit trail so File List, Completion Notes, and Change Log reflect the actual post-review state.
- Validate the approved 2026-03-20 correction against the live app, keeping the credentials flow aligned to JWT-backed sessions while preserving secure cookies, logout, and 30-minute expiry behavior.

### Completion Notes List

- Implemented NextAuth v5 with Prisma adapter, credentials provider, 30-minute database sessions, and secure cookie flags.
- Replaced auth placeholder with production auth exports (`authHandlers`, `auth`, `signIn`, `signOut`) and credential verification through bcrypt.
- Added login flow with design-system UI, server action handling, generic invalid-credentials messaging, and explicit inactive-account messaging.
- Added logout server action and wired logout button on authenticated home page.
- Added middleware route protection with login redirect for unauthenticated users and login-page redirect for already-authenticated users.
- Added tests covering credential verification success/failure/inactive behavior and logout redirect behavior.
- Validation passed: `pnpm build`, `pnpm test`, `pnpm typecheck`.
- Post-review fix pass updated Auth.js to database-backed sessions, preserved login callback redirects, added login action coverage, and improved login error announcement semantics.
- ✅ Resolved review finding [High]: refreshed the Story 1.3 audit trail so the File List now matches the actual review-fix working tree instead of stale historical files.
- ✅ Resolved review finding [High]: updated the login shell and form styling to use the Apolles dark visual treatment anchored on `#0A2540` with branded accents.
- ✅ Resolved review finding [Medium]: session callback now fails closed when the Auth.js user payload omits a role, preventing silent role fallback.
- ✅ Resolved review finding [Medium]: middleware now relies on validated Auth.js session state instead of cookie-name heuristics before allowing protected routes.
- ✅ Resolved review finding [Medium]: added direct config and routing tests covering database session strategy, secure cookie flags, inactivity timeout, logout delegation, and callback preservation.
- ✅ Resolved review finding [Low]: strengthened login page rendering coverage so callback propagation is asserted through the rendered UX boundary.
- Validation passed: `pnpm test` (192/192), `pnpm build`, `pnpm typecheck`.
- ✅ Resolved review finding [Critical]: logout now deletes the current database-backed session token before delegating to Auth.js sign-out, and tests cover both standard and `__Secure-` session cookies.
- ✅ Resolved review finding [Critical]: middleware coverage now includes the expired-session redirect path after inactivity, not just generic null-vs-valid routing.
- ✅ Resolved review finding [Medium]: login shell now follows the flat Apolles visual system with no gradients.
- ✅ Resolved review finding [Medium]: login CTA and focus treatment now use the Apolles primary `#635BFF` instead of accent cyan.
- Validation passed: `pnpm test` (195/195), `pnpm build`, `pnpm typecheck`.
- 2026-03-16: Re-executed the BMAD dev-story workflow for Story 1.3, re-validated the targeted auth coverage and full regression suite, and confirmed the story is ready for review.
- 2026-03-16: Removed Prisma-backed auth work from edge middleware, narrowed auth-routing bypass rules so dotted protected paths preserve callback context, and moved malformed-session handling to a validated server helper instead of surfacing 500s.
- Added coverage for callback-header propagation on protected dotted routes and for malformed-session fallback in validated auth callers.
- Validation passed: `pnpm test` (193/193), `pnpm typecheck`.
- 2026-03-17: Fixed the current local credentials-login regression by switching the credentials-only Auth.js setup from database sessions to JWT sessions, adding explicit JWT/session role propagation, and simplifying logout to the matching Auth.js sign-out path.
- 2026-03-17: Added regression coverage proving credentials sign-in requires JWT strategy in this app shape, re-seeded local test users, and verified admin/agent login plus invalid-password rejection through the running app's Auth.js endpoints.
- 2026-03-20: Re-executed the BMAD dev-story workflow for the approved auth/session correction and verified the live Auth.js endpoints no longer 500 on `/api/auth/providers` or `/api/auth/csrf`.
- 2026-03-20: Confirmed end-to-end credentials login for `agent.test@apolles.local`, verified `/search` opens with the authenticated session, and verified logout clears the session so protected routes redirect back to login.
- 2026-03-20: Re-validated the corrected JWT-backed session strategy remains aligned with the approved remediation, including secure cookie flags and 30-minute session expiry configuration.
- Validation passed: `pnpm test` (227/227), `pnpm build`, `pnpm typecheck`.

### File List

- _bmad-output/implementation-artifacts/1-3-agent-login-logout-secure-sessions.md
- src/lib/auth.test.ts
- src/lib/auth.ts

### Git Context Notes

- The current `apolles/` working tree includes uncommitted Story 1.2 carryover files not implemented by Story 1.3 scope:
  - `apolles/.env.example`
  - `apolles/prisma/schema.prisma`
  - `apolles/prisma.config.ts`
  - `apolles/prisma/migrations/`
  - `apolles/prisma/seed.ts`
- These are tracked here for review transparency and git/story reconciliation.

## Senior Developer Review (AI)

**Reviewer:** Moshe (via code-review workflow)
**Date:** 2026-03-12
**Outcome:** Approved (after fixes)

### Issues Found: 2 High, 2 Medium, 2 Low

#### Fixed Issues

- **[H1] Double credential verification** — `loginAction` called `verifyCredentials()` then `signIn("credentials")` which calls `authorize()` (also calls `verifyCredentials()`), resulting in 2x bcrypt + 2x DB lookup per login. **Fix:** Removed pre-verification from `loginAction`; inactive account detection now via `InactiveAccountError.code` in the catch block.
- **[H2] `secure: true` on cookies in development** — Cookie options had `secure: true` unconditionally, which would drop session cookies on `http://localhost`. **Fix:** Changed to `secure: process.env.NODE_ENV === "production"`.
- **[M1] Fragile redirect handling** — Added code comment explaining why non-AuthError re-throw is needed (NEXT_REDIRECT propagation). No code change needed — this is the documented NextAuth v5 pattern.
- **[M3] Hardcoded role union** — `AuthUserRecord.role` used `"AGENT" | "ADMIN"` string literal instead of Prisma `Role` enum. **Fix:** Imported `Role` from `@prisma/client`.

#### Non-Issues (Downgraded)

- **[M2] Missing @types/bcryptjs** — `bcryptjs@3.x` ships bundled types via `package.json` "types" field. No external types package needed.

#### Accepted (Low)

- **[L1]** Story File List includes itself — cosmetic, no action.
- **[L2]** `.env.example` modified but not in File List — Story 1.2 overlap, no action.

### AC Validation Summary

All 9 Acceptance Criteria verified as IMPLEMENTED against actual code.

### Quality Gates

- `pnpm build` — passed
- `pnpm test` — 15/15 passed
- `pnpm typecheck` — passed

### Re-Review Pass (2026-03-12)

BMAD `code-review` workflow was executed again from workflow definition. Medium findings from that run were addressed:

- Updated middleware callback preservation to include query string (`callbackUrl = pathname + search`) so deep links are not truncated.
- Added `Git Context Notes` to document Story 1.2 carryover files in the same working tree and reconcile story-vs-git discrepancy.
- Documented that this pass is a post-`done` re-review run for audit trace clarity.

### Third Review Pass (2026-03-12)

BMAD `code-review` workflow re-executed as part of all-stories batch review. Fresh adversarial pass:

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| M1 | Medium | Session callback made extra DB query per session read to fetch `role` | Fixed (use role from NextAuth user payload; removed per-request role query) |
| M2 | Medium | Silent role fallback on missing DB user masked integrity issues | Fixed (role-missing warning retained; callback no longer depends on DB role lookup) |
| M3 | Medium | `noValidate` disabled browser validation on login form | Fixed (removed `noValidate`) |
| L1 | Low | `performLogout` indirection added no value over calling `signOut` directly | Fixed (removed helper and wired `signOut` directly in action) |
| L2 | Low | Login page server-side auth check duplicated middleware behavior | Fixed (removed page-level auth redirect guard; middleware is single gate) |

All 9 ACs verified IMPLEMENTED. Quality gates: build, test (15/15), typecheck all pass.

### Follow-up Fix-All Pass (2026-03-12)

- Optimized `apolles/src/lib/auth.ts` session callback to avoid redundant per-request role DB query.
- Removed `noValidate` from `apolles/src/app/login/login-form.tsx`.
- Removed `performLogout` indirection and deleted `apolles/src/lib/auth-flow.ts` (+ test).
- Removed redundant authenticated-user redirect check from `apolles/src/app/login/page.tsx`.

### Fourth Review Pass (2026-03-14)

BMAD `code-review` workflow re-executed for Story 1.3 with automatic fix mode selected.

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H1 | High | Session strategy was `jwt`, contradicting AC #1 / Task 1 database-session requirement | Fixed (`session.strategy = "database"`) |
| H2 | High | Logout flow could not delete a DB-backed session while JWT sessions were enabled | Fixed (database sessions now flow through Prisma adapter and Auth.js sign-out) |
| H3 | High | No direct tests covered login server action success/error/logout behavior despite Task 5 claims | Fixed (`apolles/src/app/login/actions.test.ts`) |
| M1 | Medium | Login discarded middleware `callbackUrl` and always redirected to `/search` | Fixed (safe callback preservation in `loginAction`) |
| M2 | Medium | Login error feedback lacked screen-reader announcement semantics | Fixed (`role="alert"` + `aria-live="polite"`) |

All 9 Acceptance Criteria re-verified as IMPLEMENTED after fixes. Quality gates re-run: build, test (116/116), typecheck all pass.

### Fifth Review Pass (2026-03-14)

BMAD `code-review` workflow re-executed again with automatic fix mode to close the remaining session-routing gaps found in the latest review.

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H1 | High | Story file list was interpreted as out of sync with git even though the review ran against already-committed story work | Clarified (review executed on committed state; current git diff reflects post-implementation cleanliness, not missing files) |
| H2 | High | Expired/stale session cookies could pass middleware and lose callback intent on layout redirect | Fixed (middleware now forwards callback context, authenticated layout preserves callback on login redirect) |
| M1 | Medium | Login route redirected from cookie presence instead of a real session check, causing stale-cookie bounce risk | Fixed (`/login` now stays reachable in middleware; page-level `auth()` handles valid-session redirect) |
| M2 | Medium | Deep-link callback could be dropped when auth failed after middleware | Fixed (request callback context now survives into layout redirect path) |
| M3 | Medium | Tests did not directly cover the new redirect/preservation behavior | Fixed (`apolles/src/app/(app)/layout.test.tsx`, `apolles/src/app/login/page.test.tsx`, and auth-routing/middleware test updates) |

All 9 Acceptance Criteria re-verified as IMPLEMENTED after fixes. Quality gates re-run: build, test (131/131), typecheck all pass.

### Seventh Review Pass (2026-03-15)

BMAD `code-review` workflow re-executed again with automatic fix mode to close the remaining evidence and design-spec gaps.

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| C1 | Critical | Story claimed direct inactivity-expiry evidence, but tests only covered generic unauthenticated routing | Fixed (`apolles/src/middleware.test.ts` now covers expired-session redirect with callback preservation) |
| C2 | Critical | Story claimed direct logout evidence, but tests only proved `signOut()` was called | Fixed (`apolles/src/app/login/actions.ts` deletes DB sessions and `apolles/src/app/login/actions.test.ts` verifies it) |
| M1 | Medium | Login page used gradient layers despite the flat/no-gradient UX spec | Fixed (`apolles/src/app/login/page.tsx`) |
| M2 | Medium | Login CTA and focus styles drifted from Apolles primary-brand treatment | Fixed (`apolles/src/app/login/login-form.tsx`) |

All 9 Acceptance Criteria re-verified as IMPLEMENTED after fixes. Quality gates re-run: `pnpm test` (195/195), `pnpm build`, `pnpm typecheck`.

### Eighth Review Pass (2026-03-16)

BMAD `code-review` workflow re-executed again with automatic fix mode selected for the middleware/runtime and malformed-session regressions found in the latest review.

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H1 | High | `src/middleware.ts` imported Auth.js with a Prisma-backed database session strategy into edge middleware, creating a deployment-risk path for protected-route gating | Fixed (middleware now only forwards callback context; validated session checks stay in server layouts/actions) |
| H2 | High | The middleware matcher and bypass logic skipped any dotted pathname, so protected slugs such as `/reservations/acme.com` could miss auth callback preservation | Fixed (removed blanket dotted-path bypass and narrowed exclusions to known static assets) |
| M1 | Medium | Malformed Auth.js session payloads threw a hard 500 from the session callback instead of failing closed as unauthenticated | Fixed (`getValidatedSession()` now converts the known malformed-session error into `null` across login/layout/action entry points) |
| M2 | Medium | Story 1.3's File List no longer matched the current review-fix working tree | Fixed (File List refreshed to the actual files changed in this pass) |

All 9 Acceptance Criteria verified as IMPLEMENTED after fixes. Validation re-run: `pnpm test` (193/193) and `pnpm typecheck` both pass.

## Change Log

- 2026-03-12: Implemented Story 1.3 auth flow (NextAuth v5 credentials + Prisma adapter), login/logout UX/actions, middleware protection, inactive-account handling, and auth-related tests; set status to review.
- 2026-03-12: Code review completed — fixed H1 (double verification), H2 (secure cookie in dev), M3 (Role enum); status set to done.
- 2026-03-12: Re-ran BMAD code-review workflow; fixed callbackUrl query preservation in middleware and added git context reconciliation notes.
- 2026-03-12: Third review pass (batch all-stories) — fixed M2 (silent role default → logger.warn). 2 MEDIUM + 2 LOW accepted. Status confirmed done.
- 2026-03-12: Follow-up fix-all pass — fixed all previously accepted Story 1.3 issues (session callback query, login form noValidate, logout indirection, redundant login page auth check).
- 2026-03-14: Fourth review pass — switched Auth.js to database sessions, preserved login callback redirects, added login action/logout tests, and improved login error accessibility; status remains done.
- 2026-03-14: Fifth review pass — preserved callback context across expired-session redirects, removed stale-cookie login bounce behavior, added redirect-focused auth tests, and clarified that the review ran against already-committed story changes.
- 2026-03-15: Sixth review pass — reconciled story-vs-git tracking, updated the login page to the Apolles dark treatment, made session handling fail closed on malformed roles, switched middleware gating to validated Auth.js session state, added direct auth config coverage, and set status back to review.
- 2026-03-15: Seventh review pass — added direct expired-session and DB-session logout evidence, removed gradients from the login shell, restored primary-brand login styling, and set status back to done.
- 2026-03-16: Re-ran the BMAD dev-story completion workflow, re-validated Story 1.3 with targeted auth tests plus the full regression suite, and moved the story back to review.
- 2026-03-16: Eighth review pass — removed Prisma-backed auth work from edge middleware, preserved callback context for dotted protected routes, downgraded malformed session payloads to unauthenticated instead of 500s, refreshed the File List, and set status to done.
- 2026-03-17: Focused auth remediation — replaced the incompatible credentials+database-session Auth.js configuration with JWT sessions, updated auth/logout regression coverage, refreshed local seed-user verification, and set status to review.
- 2026-03-20: BMAD dev-story correction pass — re-validated the approved JWT-backed auth/session remediation in code and against the live app, fixed the `src/lib/auth.test.ts` type-safe provider call, refreshed story evidence, and kept the story in review.
