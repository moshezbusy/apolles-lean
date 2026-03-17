# Story 1.5: Simple Role-Based Authorization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the **platform**,
I want a simple role-check authorization module,
so that admin-only actions are protected and agents can only access their own data.

## Acceptance Criteria

1. **Given** the `requireAuth()` and `requireRole()` functions exist in `src/lib/authorize.ts`
   **When** a protected Server Action is called
   **Then** the precondition sequence is enforced: resolve session -> check auth -> check role -> validate input -> execute
2. **Given** `requireAuth(session)` is called
   **When** no session exists
   **Then** it throws `NOT_AUTHENTICATED`
3. **Given** `requireRole(session, 'admin')` is called
   **When** user is not admin
   **Then** it throws `NOT_AUTHORIZED`
4. **Given** role-aware bookings/reservations query surfaces are implemented in later stories
   **When** those query/services consume Story 1.5 authorization helpers
   **Then** agent access can be scoped with the shared helper contract `where: { agentId: session.user.id }`
5. **Given** admin bookings/reservations query surfaces are implemented in later stories
   **When** those query/services consume Story 1.5 authorization helpers
   **Then** admin access can execute without agent scoping restriction through the shared authorization/scoping contract
6. **Given** authorization fails
   **Then** failures return `{ success: false, error: { code: 'NOT_AUTHORIZED', message } }`
7. **Given** unit tests are run
   **Then** co-located tests cover: valid agent, valid admin, no session, wrong role

## Tasks / Subtasks

- [x] **Task 1: Implement reusable authorization helpers** (AC: #1, #2, #3)
  - [x] Create `apolles/src/lib/authorize.ts` with `requireAuth(session)` and `requireRole(session, 'admin')`.
  - [x] Ensure `requireAuth` throws typed `NOT_AUTHENTICATED` and `requireRole` throws typed `NOT_AUTHORIZED`.
  - [x] Keep role handling aligned to current runtime role enum (`AGENT` / `ADMIN`) while supporting AC semantics.

- [x] **Task 2: Enforce server action precondition order** (AC: #1, #6)
  - [x] Implement `runProtectedAction` in `apolles/src/lib/authorize.ts` with explicit sequence: session -> auth -> role -> validation -> execute.
  - [x] Define a single typed return contract for failures: `{ success: false, error: { code, message } }`.
  - [x] Map no-session to `NOT_AUTHENTICATED` and role mismatch to `NOT_AUTHORIZED`.

- [x] **Task 3: Add scoped access helpers for agent/admin data access** (AC: #4, #5)
  - [x] Add `buildBookingScope(session)` in `apolles/src/lib/authorize.ts`.
  - [x] Define the reusable agent scoping contract (`where.agentId = session.user.id`) for later persisted booking/reservation queries.
  - [x] Define the admin unscoped contract for later admin-only booking/reservation flows.

- [x] **Task 4: Integrate helpers in current protection entry points** (AC: #1, #3, #6)
  - [x] Update `apolles/src/app/(app)/admin/layout.tsx` to consume `requireRole` for consistency.
  - [x] Keep middleware-based protection behavior unchanged and non-regressive.
  - [x] Do not duplicate role logic across files; centralize authorization checks.

- [x] **Task 5: Add co-located unit tests for authorization behavior** (AC: #7)
  - [x] Create `apolles/src/lib/authorize.test.ts` and cover valid agent, valid admin, no session, wrong role.
  - [x] Add a test that verifies validation does not execute before auth/role checks fail.
  - [x] Ensure tests are deterministic and follow existing Vitest style.

- [x] **Task 6: Verification and quality gates**
  - [x] Run `pnpm test`.
  - [x] Run `pnpm typecheck`.
  - [x] Run `pnpm build`.

## Dev Notes

- This story should introduce a centralized authz module (`authorize.ts`) and avoid scattered role checks.
- Existing auth/session foundation is already implemented in Story 1.3 (`auth.ts`, middleware integration, session role payload).
- Existing admin route guard is present from Story 1.4 and should be aligned with the new centralized helper.

### Technical Requirements

- **Precondition order is mandatory:** resolve session -> auth -> role -> validation -> execution.
- **Error contracts:** use typed errors (`NOT_AUTHENTICATED`, `NOT_AUTHORIZED`) and return typed action results for failures with shape `{ success: false, error: { code, message } }`.
- **Role model consistency:** current runtime role values are Prisma enum `AGENT`/`ADMIN`; do not introduce conflicting role strings.
- **Role API contract:** implement `requireRole(session, role)` with AC-friendly input (`'admin' | 'agent'`) and map internally to Prisma enum (`ADMIN` / `AGENT`).
- **Scoping model:** Story 1.5 defines the reusable scoping contract for booking/reservation queries: later persisted agent queries apply `where: { agentId: session.user.id }`, while admin flows may query unscoped.
- **No auth regression:** do not break existing login/logout/session middleware behavior from Stories 1.3/1.4.

### Architecture Compliance

- Keep authorization helper in `apolles/src/lib/authorize.ts` as specified by epics + architecture.
- Follow existing App Router + Server Action patterns and keep checks close to data boundaries.
- Respect architecture layering: pages/layouts invoke actions/services; avoid embedding DB access in UI layers.
- Preserve typed error patterns from `apolles/src/lib/errors.ts`.

### Library / Framework Requirements

- Next.js App Router (current project baseline uses Next.js 15).
- NextAuth v5 (`auth()` session resolution patterns).
- Prisma role enums and DB session strategy.
- Zod validation after auth/role preconditions.
- Vitest for co-located unit tests.

### File Structure Requirements

- **Create:** `apolles/src/lib/authorize.ts`
- **Create:** `apolles/src/lib/authorize.test.ts`
- **Update:** `apolles/src/app/(app)/admin/layout.tsx`

### Testing Requirements

- Co-located tests in Vitest style.
- Must cover required AC scenarios:
  - valid agent auth path
  - valid admin role path
  - no session -> `NOT_AUTHENTICATED`
  - wrong role -> `NOT_AUTHORIZED`
- Add sequence guard test proving validation does not execute if auth/role preconditions fail.
- Keep tests small and pure where possible (same pattern as `auth-routing.test.ts`, `navigation-config.test.ts`).

### Previous Story Intelligence (from 1.3 and 1.4)

- Story 1.3 established stable NextAuth v5 flow with DB sessions, callback URL preservation, and secure cookie behavior.
- Story 1.4 added role-aware navigation plus admin route-group guard; this story should centralize role checks so they are reusable beyond UI routing.
- Current codebase favors pure helper modules with focused tests; follow this pattern for `authorize.ts`.

### Git Intelligence Summary

- Recent root commits indicate planning-first workflow and lean MVP alignment (`4a04c6e`, `ee331bb`, `f8e448b`, `f58e687`, `e31fcaa`).
- In-code conventions favor concise typed helpers, path aliases (`~`), and co-located Vitest tests.
- Keep changes minimal and consistent with existing style; avoid introducing new frameworks or broad refactors.

### Latest Tech Information

- Auth.js guidance: protect middleware/routes, but verify session and authorization close to data access boundaries (do not rely on middleware alone).
- Next.js Server Actions: action handlers should remain server-side (`"use server"`) and can return structured results for UI handling.
- Current project already uses middleware for route-level auth; Story 1.5 should complement this with server-action/service-level authorization.

### Project Structure Notes

- No `project-context.md` file was found in the repository.
- Current implementation does not yet include the persisted booking/reservation query layer; this story builds reusable authorization/scoping utilities to unblock those later stories.
- Maintain compatibility with existing Story 1.4 admin layout guard until feature actions adopt `requireRole` directly.

### References

- Story definition and ACs [Source: `_bmad-output/planning-artifacts/epics.md:427`]
- Authorization helper location and behavior [Source: `_bmad-output/planning-artifacts/architecture.md:305`]
- Typed error model [Source: `_bmad-output/planning-artifacts/architecture.md:386`]
- Server action precondition pattern [Source: `_bmad-output/planning-artifacts/architecture.md:645`]
- Agent/admin scoping expectations [Source: `_bmad-output/planning-artifacts/architecture.md:924`]
- UX error feedback and validation behavior [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:223`]
- Previous story context [Source: `_bmad-output/implementation-artifacts/1-4-dashboard-shell-with-sidebar-navigation.md`]
- Previous auth/session context [Source: `_bmad-output/implementation-artifacts/1-3-agent-login-logout-secure-sessions.md`]

## Dev Agent Record

### Agent Model Used

openai/gpt-5.4

### Debug Log References

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test -- --runInBand`
- `pnpm test -- "src/features/reservations/reservation-visibility.test.ts" "src/app/(app)/reservations/page.test.tsx" "src/app/(app)/admin/bookings/page.test.tsx"`
- `pnpm exec next typegen --help`
- `git status --porcelain`
- `git diff --name-only`
- `git diff --cached --name-only`

### Implementation Plan

- Add a minimal runtime reservation visibility service that consumes `buildBookingScope()` against local reservation fixtures.
- Wire the existing reservations and admin bookings pages to that service without implementing the broader Epic 5 / Epic 6 UI scope.
- Add runtime-focused tests that prove agent scoping, admin unscoped access, helper consumption, and safe unauthenticated failure behavior.

### Completion Notes List

- Implemented centralized authorization helpers: `requireAuth`, `requireRole`, `buildBookingScope`, and `runProtectedAction`.
- Integrated `requireRole` into admin layout so role checks are centralized in `src/lib/authorize.ts`.
- Added full unit test coverage for required role/auth cases plus precondition-order validation guard behavior.
- Code review remediation: aligned `requireRole` semantics with architecture (admin-as-superset), added typed Zod validation failure mapping in `runProtectedAction`, and expanded tests for edge and success paths.
- Validation passed: `pnpm test` (35/35), `pnpm typecheck`, `pnpm build`.
- Follow-up remediation: `buildBookingScope()` now returns a Prisma-ready `where` clause, admin layout preserves login callback URLs for unauthenticated access, and review coverage now includes admin layout redirects plus role-failure precondition guards.
- Story 1.5 delivers the reusable authorization foundation and scoping contract before persisted booking/reservation query surfaces exist.
- Follow-up remediation (2026-03-16): moved search options validation behind `runProtectedAction` auth preconditions, guaranteed typed `ActionResult` for unexpected failures via `INTERNAL_ERROR`, and aligned admin layout unauthenticated behavior with callback-preserving login redirects.
- Follow-up remediation (2026-03-16): added a minimal live reservation visibility slice that now consumes `buildBookingScope()` in runtime code for both `/reservations` and `/admin/bookings`.
- Added runtime-focused tests proving agent-scoped reservation access, admin unscoped booking visibility, and safe unauthenticated failures without expanding into Epic 5 or Epic 6 feature scope.
- Validation passed: `pnpm test -- "src/features/reservations/reservation-visibility.test.ts" "src/app/(app)/reservations/page.test.tsx" "src/app/(app)/admin/bookings/page.test.tsx"` (211/211), `pnpm typecheck`, `pnpm build`.
- Review remediation (2026-03-16): added the explicit shared role gate to `searchHotelsAction`, moved reservation scoping through a dedicated query boundary helper, replaced proof/demo wording on reservation/admin pages, and expanded regression coverage for admin access plus scoped query execution.
- Final root-cause remediation (2026-03-16): replaced the empty-object admin scope with explicit access kinds, moved reservation/admin access derivation fully inside the reservation boundary, removed the bypassable exported query helper, restored `searchHotelsAction` to authenticated-only access for both agents and admins, and made `/reservations` redirect safely to login when session resolution fails.
- Scope correction (2026-03-17): AC #4/#5 are re-scoped to the authorization/scoping contract this story is intended to provide. Real persisted bookings/reservations query enforcement is deferred to the later booking, reservations, and admin stories that introduce those persisted query boundaries.
- Final review remediation (2026-03-16): made `/reservations` explicitly agent-only by redirecting admins to `/admin/bookings`, tightened the reservation visibility service to reject admin access outside the admin boundary, and updated both page copies so the route split is explicit.
- Added direct regression coverage for admin visits to `/reservations`, unauthenticated direct access to `/admin/bookings`, and the agent-only reservation service boundary.
- Typecheck flake investigation (2026-03-16): the repo-level `tsconfig.json` includes `.next/types/**/*.ts`, while `next typegen` alone only regenerated route/validator files and left app page type files absent; `pnpm typecheck` is now stabilized by running `next typegen && next build && tsc --noEmit --incremental false` so both route types and page/layout type artifacts exist before `tsc` runs.
- Validation passed: `pnpm test` (217/217), `pnpm typecheck`, `pnpm build`.
- Code-review traceability remediation (2026-03-17): refreshed the story with an explicit `Dev Agent Record -> File List`, corrected the current worktree snapshot to match live git, and removed the overclaim that `/admin/bookings` consumes `buildBookingScope()` directly at runtime.

### Senior Developer Review (AI)

- Reviewer: Moshe
- Date: 2026-03-12
- Outcome: Approved after fixes
- Findings resolved: 1 High, 3 Medium
- Validation rerun: `pnpm test` (35/35), `pnpm typecheck`, `pnpm build`

- Reviewer: Moshe
- Date: 2026-03-14
- Outcome: Changes requested after remediation
- Findings fixed: 1 High, 2 Medium, 1 Low
- Remaining issue: booking/reservation runtime queries do not exist yet, so ACs for enforced agent/admin query scoping are still not verifiable in application code
- Validation rerun: `pnpm test -- --runInBand` (135/135), `pnpm typecheck`, `pnpm build`

- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Changes requested after remediation
- Findings fixed: 1 High, 3 Medium
- Remaining issue: booking/reservation runtime queries are still not implemented, so ACs for enforced runtime agent/admin query scoping (AC #4/#5) remain pending until those features exist
- Validation rerun: `pnpm test -- --runInBand` (206/206), `pnpm typecheck`

- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after fixes
- Findings fixed: 2 High, 2 Medium
- Validation rerun: `pnpm test -- "src/app/(app)/search/actions.test.ts" "src/features/reservations/reservation-visibility.test.ts" "src/app/(app)/reservations/page.test.tsx" "src/app/(app)/admin/bookings/page.test.tsx"` (213/213), `pnpm typecheck`

- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after root-cause remediation
- Findings fixed: 2 recurring process issues, 2 runtime authorization issues, 1 story overclaim issue
- Validation rerun: `git status --porcelain`, `git diff --name-only`, `git diff --cached --name-only`, `pnpm test -- "src/lib/authorize.test.ts" "src/app/(app)/search/actions.test.ts" "src/features/reservations/reservation-visibility.test.ts" "src/app/(app)/reservations/page.test.tsx" "src/app/(app)/admin/bookings/page.test.tsx" "src/app/(app)/admin/layout.test.tsx"` (215/215), `pnpm test`, `pnpm typecheck`, `pnpm build`

- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Changes requested
- Findings fixed: 1 process issue (story/sprint status sync), 1 process issue (stale worktree snapshot)
- Remaining issue: AC #4/#5 still do not execute through a persisted bookings/reservations query boundary because `src/features/reservations/reservation-visibility.ts` reads fixture-backed records instead of Prisma-backed bookings/reservations data
- Scope decision: the reported `searchHotelsAction` supplier-selection concern is out of scope for Story 1.5 because this story owns authorization helpers and query scoping, not Epic 2 search-product defaults
- Validation rerun: `git status --porcelain`, `git diff --name-only`, `git diff --cached --name-only`, `pnpm test`, `pnpm typecheck`, `pnpm build`

- Reviewer: Moshe
- Date: 2026-03-17
- Outcome: Approved after scope correction
- Decision: Story 1.5 is a foundation story for auth/authz helpers, typed failures, precondition ordering, and reusable scoping contracts. It does not own full persisted bookings/reservations query enforcement.
- Deferred scope: persisted agent reservations query enforcement belongs with booking persistence and reservations/admin stories in Epic 4, Epic 5, and Epic 6.
- Validation note: no additional persistence implementation required for this correction pass

- Reviewer: OpenCode
- Date: 2026-03-17
- Outcome: Approved after traceability fixes
- Findings fixed: 1 High, 2 Medium
- Validation rerun: `git status --porcelain`, `git diff --name-only`, `git diff --cached --name-only`

### File List

- `_bmad-output/implementation-artifacts/1-5-simple-role-based-authorization.md`
- `src/lib/authorize.ts`
- `src/lib/authorize.test.ts`
- `src/app/(app)/admin/layout.tsx`
- `src/app/(app)/admin/layout.test.tsx`
- `src/app/(app)/admin/bookings/page.tsx`
- `src/app/(app)/admin/bookings/page.test.tsx`
- `src/app/(app)/search/actions.ts`
- `src/app/(app)/search/actions.test.ts`
- `src/app/(app)/reservations/page.tsx`
- `src/app/(app)/reservations/page.test.tsx`
- `src/features/reservations/reservation-visibility.ts`
- `src/features/reservations/reservation-visibility.test.ts`
- `src/lib/errors.ts`
- `src/lib/errors.test.ts`
- `package.json`

### Implementation File Ledger (Cumulative)

This ledger is cumulative across all Story 1.5 implementation and remediation passes. It is historical context only and does not imply that these files currently have uncommitted git changes.

- _bmad-output/implementation-artifacts/1-5-simple-role-based-authorization.md
- src/lib/authorize.ts
- src/lib/authorize.test.ts
- src/app/(app)/admin/layout.tsx
- src/app/(app)/admin/layout.test.tsx
- src/app/(app)/admin/bookings/page.tsx
- src/app/(app)/admin/bookings/page.test.tsx
- src/app/(app)/search/actions.ts
- src/app/(app)/search/actions.test.ts
- src/app/(app)/reservations/page.tsx
- src/app/(app)/reservations/page.test.tsx
- src/features/reservations/reservation-visibility.ts
- src/features/reservations/reservation-visibility.test.ts
- src/lib/errors.ts
- src/lib/errors.test.ts
- package.json

### Current Review Worktree Snapshot

This section records git-visible changes for the active review/remediation pass only. Future reviews must refresh this snapshot rather than interpreting the cumulative file ledger as a live diff.

- Snapshot commands: `git status --porcelain`, `git diff --name-only`, `git diff --cached --name-only`
- Snapshot rule: when the worktree is clean, record `No current git-visible changes; repository clean at review time.`
- Snapshot captured on 2026-03-17 during BMAD code review.
- Current git-visible changes in this review pass are refreshed from the live commands listed above and must match the active worktree exactly.
- Current git-visible changes in this review pass:
  - No current git-visible changes; repository clean at review time.

## Change Log

- 2026-03-12: Created Story 1.5 with full implementation context and set status to ready-for-dev.
- 2026-03-12: Implemented Story 1.5 authorization module, integrated admin layout role checks, added tests, and moved story to review.
- 2026-03-12: Completed adversarial code review remediation and moved story to done.
- 2026-03-14: Re-ran code review, corrected authorization helper shape and admin login redirect handling, added regression tests, and moved story back to in-progress because runtime booking/reservation scoping is still pending.
- 2026-03-16: Applied automatic code-review remediations for precondition ordering, typed unexpected failure handling, and admin unauthenticated redirect behavior; story remains in-progress due to pending runtime booking/reservation query implementations.
- 2026-03-16: Added a lean runtime reservation visibility slice for `/reservations` and `/admin/bookings`, proving `buildBookingScope()` is consumed in live code and moving the story back to review.
- 2026-03-16: Closed the latest code-review findings by enforcing the shared role gate in `searchHotelsAction`, routing reservation visibility through an explicit scoped query helper, tightening regression coverage, and moving the story to done.
- 2026-03-16: Re-entered review for final root-cause remediation to fix story/git traceability, workflow-state drift, reservation authorization boundary hardening, and graceful unauthenticated reservations handling.
- 2026-03-16: Completed final root-cause remediation, refreshed review snapshot metadata, aligned sprint/story state transitions, hardened reservation access boundaries, restored authenticated-only hotel search access, and moved the story back to done.
- 2026-03-16: Addressed the final review follow-up by making `/reservations` agent-only, keeping admin all-access only in `/admin/bookings`, adding direct route-separation tests, and stabilizing `pnpm typecheck` with a deterministic Next type-generation/build sequence.
- 2026-03-16: Re-ran BMAD code review remediation, confirmed AC #4/#5 still overclaim fixture-backed query enforcement, corrected Story 1.5 back to in-progress, re-synced sprint tracking, and refreshed the review worktree snapshot to the live git state.
- 2026-03-17: Executed BMAD story-scope correction, updated Story 1.5 acceptance criteria to match its intended authorization-foundation role, explicitly deferred persisted bookings/reservations enforcement to later roadmap stories, and moved the story back to done.
- 2026-03-17: Fixed BMAD code-review traceability findings by restoring an explicit Dev Agent Record file list, correcting the live worktree snapshot to the clean git state, and removing the story overclaim about direct admin-path `buildBookingScope()` consumption.
