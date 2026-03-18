# Story 1.4: Dashboard Shell with Sidebar Navigation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **agent**,
I want to see an authenticated dashboard with sidebar navigation,
so that I have a central workspace to access all platform features.

## Acceptance Criteria

1. **Given** I am logged in
   **When** I access any authenticated page
   **Then** I see a sidebar with navigation items: Search (active by default), Reservations
2. **Given** I am an admin user
   **When** I access the authenticated area
   **Then** I additionally see: All Bookings, Supplier Logs, Platform Settings
3. **Given** the sidebar is rendered
   **Then** it uses `#0A2540` dark background with white text
   **And** active nav item shows `#635BFF` primary text with left accent bar
4. **Given** the authenticated shell is visible
   **Then** my name and role are displayed at the sidebar bottom
   **And** logout action is available from sidebar bottom
5. **Given** I access authenticated pages without a valid session
   **Then** unauthenticated access redirects to login via Next.js middleware
6. **Given** authenticated pages are rendered
   **Then** semantic landmarks exist: `header`, `nav`, `main`
   **And** skip-to-content link is visible on first Tab press
   **And** focus indicators use 2px primary outline with 2px offset
7. **Given** viewport width is mobile (`< 768px`)
   **Then** sidebar navigation is replaced by simple header + hamburger menu

## Tasks / Subtasks

- [x] **Task 1: Build authenticated app shell and route structure** (AC: #1, #2, #5)
  - [x] Create shell components under `src/components/layout/`: `app-shell.tsx`, `sidebar.tsx`, `page-header.tsx`.
  - [x] Introduce authenticated route groups/pages for `search`, `reservations`, and admin shell destinations (`admin/bookings`, `admin/supplier-logs`, `admin/settings`) with story-appropriate content; `admin/settings` now carries later Epic 1 agent-management functionality on the same route.
  - [x] Keep `/login` outside authenticated shell; keep auth API route intact.
  - [x] Ensure Search is the default active destination for authenticated users.

- [x] **Task 2: Implement role-aware sidebar navigation** (AC: #1, #2, #3)
  - [x] Implement agent nav items: Search, Reservations.
  - [x] Implement admin-only section: All Bookings, Supplier Logs, Platform Settings.
  - [x] Style sidebar with `#0A2540`-aligned design tokens and white text.
  - [x] Implement active state with primary color text + left accent bar.

- [x] **Task 3: Implement shell footer identity and logout** (AC: #4)
  - [x] Display session user name + role in sidebar bottom area.
  - [x] Wire logout action in shell footer to existing NextAuth sign-out flow.
  - [x] Ensure behavior works for both agent and admin roles.

- [x] **Task 4: Finalize auth gate behavior in middleware** (AC: #5)
  - [x] Confirm middleware protects authenticated page routes, excludes `/login` and all `/api/*` routes, and keeps Auth.js route handlers untouched.
  - [x] Ensure requests without a session cookie redirect to login with callback URL preserved.
  - [x] Ensure validated sessions hitting `/login` are redirected to app home without requiring Prisma-backed session checks inside middleware.

- [x] **Task 5: Accessibility and responsive navigation behavior** (AC: #6, #7)
  - [x] Add semantic landmarks (`header`, `nav`, `main`) in shell layout.
  - [x] Add keyboard-visible skip-to-content link (first Tab).
  - [x] Ensure interactive controls expose visible 2px focus outline with 2px offset (using existing global token rules).
  - [x] Implement mobile header + hamburger menu for nav under `md` breakpoint.

- [x] **Task 6: Verification and quality gates**
  - [x] Add/update tests for role-based nav visibility and auth redirect behavior where practical.
  - [x] Run `pnpm build`, `pnpm test`, `pnpm typecheck`.

## Dev Notes

- Story 1.3 already delivered auth + middleware baseline; this story should extend shell/navigation only, not re-implement credentials/auth core.
- Keep NextAuth v5 patterns (`auth()`, server components for shell, lightweight middleware routing). Do not move Prisma-backed database session validation into middleware on the current project stack.
- Preserve Supabase + Prisma setup; no schema changes required for this story.
- Follow established design tokens from `apolles/src/app/globals.css` (primary `#635BFF`, dark `#0A2540`, focus ring tokens).

### Technical Requirements

- **Framework pattern:** Server Components by default for layout/navigation; Client Components only for interactive hamburger toggles.
- **Navigation source of truth:** Single typed nav config that supports role filtering (agent/admin) to avoid duplicated lists.
- **Route protection:** Middleware remains enforcement point for page-level auth redirects.
- **Role handling:** Read role from session (`session.user.role`) populated by Story 1.3 auth callback.
- **Do not add** Story 1.5 authorization helpers yet (`requireAuth`, `requireRole`) unless strictly needed for shell rendering.

### Architecture Compliance

- Keep code under architecture paths:
  - `src/components/layout/` for shell components
  - `src/app/` for page/layout routes
  - `src/middleware.ts` for auth redirects
- Respect App Router boundaries:
  - Layout and static nav in Server Components
  - Hamburger/menu state in Client Component
- No supplier/business logic in this story.

### Library / Framework Requirements

- Next.js App Router (current project uses Next.js 15)
- NextAuth v5 beta APIs already adopted in project
- shadcn/ui primitives may be used for buttons/dialog/sheet-like nav if needed
- Tailwind v4 CSS-first tokens only (no tailwind.config.js additions)

### File Structure Requirements

- Expected touched/created files (implementation target):
  - `src/components/layout/app-shell.tsx`
  - `src/components/layout/sidebar.tsx`
  - `src/components/layout/page-header.tsx`
  - `src/app/page.tsx` (home behavior alignment)
  - `src/app/search/page.tsx` (placeholder shell content)
  - `src/app/reservations/page.tsx` (placeholder shell content)
  - `src/app/admin/bookings/page.tsx` (placeholder)
  - `src/app/admin/supplier-logs/page.tsx` (placeholder)
  - `src/app/admin/settings/page.tsx` (admin shell route; later extended by agent-management work)
  - `src/middleware.ts` (only if adjustments needed)

### Testing Requirements

- Preserve and extend current Vitest setup.
- Add focused tests for:
  - Role-based nav visibility logic (agent vs admin)
  - Middleware redirect behavior remains correct for protected routes and `/login`
  - Any extracted pure helpers for nav config/state decisions

### Previous Story Intelligence (from 1.3)

- Existing middleware already preserves callback URL query string; do not regress this behavior.
- Story 1.3 review history proved that Prisma-backed database session checks in middleware are fragile on the current stack; keep authoritative session validation in server `auth()` calls instead.
- Logout flow now calls NextAuth `signOut` directly from server action; reuse this in sidebar footer.
- Session role currently comes from NextAuth user payload in callback; avoid extra DB lookups in layout rendering.

### Git Intelligence Summary

- Recent commits are sparse (`9bf0d9e`, `eb56ab8`), so rely on current codebase conventions rather than commit cadence.
- Existing code style in active files uses concise functional components, tokenized class names, and small helper modules.
- Current worktree already contains Story 1.2/1.3 changes; implement Story 1.4 without undoing prior in-progress modifications.

### Latest Tech Information

- Auth.js (NextAuth v5) supports middleware wrapping via `export default auth((req) => ...)`, but its own migration guidance warns that database-session setups with Prisma should avoid adapter-backed middleware unless the runtime is compatible; this project therefore keeps authoritative session validation in server `auth()` calls and uses middleware only for lightweight routing decisions.
- Next.js middleware defaults to the Node.js runtime only in newer releases; this project is currently on Next.js 15.2.3, so the safer current-state approach is to avoid Prisma-backed session validation inside middleware.
- Auth.js docs continue to recommend generic credential failure messages for Credentials provider (already aligned in Story 1.3).

### Project Structure Notes

- Use existing `src/components/layout/` directory created in prior fixes.
- Keep `/login` as unauthenticated page; authenticated shell should wrap app pages only.
- Do not introduce agent settings nav item yet (lean MVP sidebar in current epic scope is Search + Reservations for agents).

### References

- Story definition and ACs [Source: `_bmad-output/planning-artifacts/epics.md:404`]
- Auth/session and middleware direction [Source: `_bmad-output/planning-artifacts/architecture.md:293`]
- Frontend component boundary map [Source: `_bmad-output/planning-artifacts/architecture.md:534`]
- Target project structure for layout components [Source: `_bmad-output/planning-artifacts/architecture.md:861`]
- Sidebar composition and role items [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:493`]
- Accessibility and responsive requirements [Source: `_bmad-output/planning-artifacts/ux-design-specification.md:1541`]
- Previous story implementation learnings [Source: `_bmad-output/implementation-artifacts/1-3-agent-login-logout-secure-sessions.md`]

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- create-story workflow executed for next backlog item from sprint status
- source analysis: epics + architecture + ux + previous story + auth docs
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test` (review remediation)
- `pnpm typecheck` (review remediation)
- `pnpm build` (review remediation)
- `pnpm test` (adversarial remediation)
- `pnpm build` (adversarial remediation)
- `pnpm typecheck` (adversarial remediation)
- focused remediation scope mapping: Story 1.4 shell/navigation vs Story 2.6 search-page UI
- `pnpm test --run src/components/layout/app-shell.test.tsx src/components/layout/sidebar.test.tsx src/components/layout/navigation-config.test.ts src/features/reservations/reservation-visibility.test.ts src/app/(app)/reservations/page.test.tsx src/app/(app)/admin/bookings/page.test.tsx src/app/(app)/layout.test.tsx`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

### Completion Notes List

- Implemented authenticated app shell route group with shared layout and skip link.
- Added responsive sidebar with role-aware navigation (agent + admin sections), active state accent, and mobile hamburger menu.
- Added sidebar footer identity and logout action wired to existing NextAuth v5 sign-out server action.
- Redirected authenticated entry points to `/search` and aligned login redirect behavior to `/search`.
- Refactored middleware redirect decisions into tested pure helper (`auth-routing.ts`) while preserving callback URL behavior.
- Added nav configuration helper and unit tests for role visibility and active-route detection.
- Added placeholder pages for Search, Reservations, and admin destinations to complete shell navigation routes.
- Validation passed: `pnpm test` (23/23), `pnpm typecheck`, `pnpm build`.
- Code review remediation: added desktop sidebar header landmark, fixed skip-link keyboard visibility behavior, aligned sidebar width to 240px, and added icon-based navigation.
- Implemented collapsible desktop sidebar (240px/64px) with `localStorage` persistence and hydration-safe initialization.
- Added admin route-group layout guard so non-admin users are redirected away from `/admin/*` pages.
- Review remediation: made `pnpm typecheck` reproducible on a clean checkout by generating Next route types and disabling stale incremental cache reuse.
- Review remediation: kept user name and role visible in the collapsed desktop sidebar footer and added sidebar regression coverage.
- Review remediation: bypassed auth routing for public asset paths and extended auth-routing tests for asset handling.
- Review remediation: implemented middleware auth enforcement for protected routes with callback-preserving login redirects, and authenticated `/login` redirects to `/search`.
- Review remediation: improved skip-link target behavior by making main content programmatically focusable (`tabIndex={-1}`).
- Review remediation: added middleware regression coverage for protected-route redirects and login-route behavior.
- Review remediation: an earlier pass temporarily centralized unauthenticated redirects in middleware only; that design was later superseded because Prisma-backed session validation does not belong in middleware on the current stack.
- Review remediation: short-circuited middleware session lookups for public routes outside protected/login handling.
- Review remediation: added jsdom sidebar interaction coverage for mobile hamburger toggling and persisted desktop collapse state.
- Review remediation: synchronized story task wording and file notes with the current `admin/settings` route ownership.
- Review remediation: removed Prisma-backed session validation from middleware, restored validated-session redirects to server `auth()` entry points, and replaced the auth-routing denylist with an explicit public-route registry that keeps unknown routes protected by default.
- Reopened Story 1.4 for a focused shell remediation pass: expanded the authenticated shell to fill the viewport, made the desktop sidebar height stable, and separated Reservations from All Bookings so admin users no longer collide into the admin all-bookings route when selecting Reservations.
- Classified the remaining sparse Search page composition as Story 2.6 UI follow-up work rather than silently folding it into Story 1.4.

### File List

- Cumulative story file list covering the original implementation plus review remediations. Current review remediation changes are reflected in the git worktree; earlier implementation files may already be committed.
- Current review worktree changes (git-visible):
  - src/app/(app)/reservations/page.test.tsx
  - src/app/(app)/reservations/page.tsx
  - src/components/layout/app-shell.test.tsx
  - src/components/layout/app-shell.tsx
  - src/components/layout/navigation-config.test.ts
  - src/components/layout/sidebar.test.tsx
  - src/components/layout/sidebar.tsx
  - src/features/reservations/reservation-visibility.test.ts
  - src/features/reservations/reservation-visibility.ts
- Current review artifact updates outside git-visible diff in this repo configuration:
  - _bmad-output/implementation-artifacts/1-4-dashboard-shell-with-sidebar-navigation.md
- _bmad-output/implementation-artifacts/1-4-dashboard-shell-with-sidebar-navigation.md
- src/app/page.tsx
- src/app/login/page.tsx
- src/app/login/actions.ts
- src/app/(app)/layout.tsx
- src/app/(app)/layout.test.tsx
- src/app/(app)/search/page.tsx
- src/app/(app)/reservations/page.tsx
- src/app/(app)/admin/bookings/page.tsx
- src/app/(app)/admin/supplier-logs/page.tsx
- src/app/(app)/admin/settings/page.tsx
- src/app/(app)/admin/layout.tsx
- src/app/(app)/admin/layout.test.tsx
- src/components/layout/app-shell.tsx
- src/components/layout/app-shell.test.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/sidebar.test.tsx
- src/components/layout/page-header.tsx
- src/components/layout/navigation-config.ts
- src/components/layout/navigation-config.test.ts
- src/lib/auth-routing.ts
- src/lib/auth-routing.test.ts
- src/middleware.ts
- src/middleware.test.ts
- src/app/login/page.test.tsx
- src/app/globals.test.ts
- package.json
- vitest.config.ts

### Senior Developer Review (AI)

- Reviewer: Moshe
- Date: 2026-03-12
- Outcome: Approved after fixes
- Findings resolved: 2 High, 4 Medium
- Validation rerun: `pnpm test` (23/23), `pnpm typecheck`, `pnpm build`
- Reviewer: Moshe
- Date: 2026-03-14
- Outcome: Approved after automated remediation
- Findings resolved: 3 High, 2 Medium
- Git note: review began against previously committed implementation; remediation is captured in the current worktree updates above
- Validation rerun: `pnpm test` (120/120), `pnpm typecheck`, `pnpm build`
- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after automated remediation
- Findings resolved: 2 High, 3 Medium
- Validation rerun: `pnpm test` (195/195), `pnpm typecheck`, `pnpm build`
- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after automated remediation
- Findings resolved: 2 High, 3 Medium
- Fix summary: restored middleware as the single unauthenticated redirect gate, skipped session DB reads on public routes, added interactive sidebar regression coverage, and synced story metadata with current route ownership
- Validation rerun: `pnpm test` (196/196), `pnpm typecheck`, `pnpm build`
- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after automated remediation
- Findings resolved: 2 High, 2 Medium
- Fix summary: added `/booking` to protected middleware route detection, added booking-route redirect regression tests, and increased sidebar logout target sizes for mobile/touch accessibility.
- Validation rerun: `pnpm test` (197/197), `pnpm typecheck`
- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after automated remediation
- Findings resolved: 2 High, 3 Medium
- Fix summary: switched auth routing from a brittle protected-prefix allowlist to a public-route denylist, added shell landmark/skip-link regression coverage, normalized story file paths to repo-relative paths, and clarified cumulative file-list vs committed implementation history for git transparency.
- Git note: this review started against previously committed implementation; current worktree captures only the remediation delta applied during this review pass.
- Validation rerun: `pnpm test` (198/198), `pnpm typecheck`
- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Full verification rerun requested on a story already marked `done`; reviewability precondition was not met at invocation, so this pass documents the deviation explicitly.
- Findings resolved this pass: strengthened AC6 verification coverage and added explicit current-worktree traceability notes for the rerun.
- Git status (`git status --porcelain`): ` M src/components/layout/app-shell.tsx`; ` M src/lib/auth-routing.test.ts`; ` M src/lib/auth-routing.ts`; `?? src/app/globals.test.ts`; `?? src/components/layout/app-shell.test.tsx`
- Git diff files (`git diff --name-only`): `src/components/layout/app-shell.tsx`, `src/lib/auth-routing.test.ts`, `src/lib/auth-routing.ts`
- Git staged files (`git diff --cached --name-only`): none
- Validation rerun: `pnpm test` (199/199), `pnpm typecheck`, `pnpm build`
- Build note: direct `pnpm build` initially failed on stale `.next` filesystem artifacts (`ENOENT` rename inside `.next`); rerun succeeded after clearing generated `.next` output and rebuilding.
- Reviewer: Moshe
- Date: 2026-03-16
- Outcome: Approved after automated remediation
- Review cycle note: story was reopened to `review` for this remediation pass, then returned to `done` after validation completed.
- Findings resolved this pass: removed Prisma-backed middleware session reads, restored validated-session redirects to server `auth()` entry points, corrected Task 4/story architecture notes, and replaced implicit route protection with an explicit public-route registry plus future-route tests.
- Git status (`git status --porcelain`): ` M src/app/(app)/layout.test.tsx`; ` M src/app/(app)/layout.tsx`; ` M src/app/login/page.test.tsx`; ` M src/app/login/page.tsx`; ` M src/lib/auth-routing.test.ts`; ` M src/lib/auth-routing.ts`; ` M src/middleware.test.ts`; ` M src/middleware.ts`
- Git diff files (`git diff --name-only`): `src/app/(app)/layout.test.tsx`, `src/app/(app)/layout.tsx`, `src/app/login/page.test.tsx`, `src/app/login/page.tsx`, `src/lib/auth-routing.test.ts`, `src/lib/auth-routing.ts`, `src/middleware.test.ts`, `src/middleware.ts`
- Git staged files (`git diff --cached --name-only`): none
- Validation rerun: `pnpm test` (203/203), `pnpm typecheck`, `pnpm build`
- Build note: `pnpm build` first hit the recurring `.next` `ENOENT` rename artifact; rerun passed after clearing generated `.next` output and rebuilding.

## Change Log

- 2026-03-12: Implemented Story 1.4 dashboard shell with role-aware sidebar navigation, responsive mobile menu, skip-link + semantic landmarks, and middleware redirect helper tests. Story moved to review.
- 2026-03-12: Completed adversarial code review remediation (admin route guard, sidebar accessibility/UX parity improvements, collapsible sidebar persistence) and moved story to done.
- 2026-03-14: Completed follow-up review remediation for reproducible typechecking, collapsed-sidebar identity visibility, public-asset auth bypass, and added regression coverage for sidebar/auth-routing behavior.
- 2026-03-16: Completed additional adversarial remediation for middleware route protection, callback-preserving unauthenticated redirects, authenticated `/login` redirect behavior, skip-link focus target reliability, and middleware regression tests.
- 2026-03-16: Reopened review remediation, restored middleware-only unauthenticated redirects, skipped middleware session lookups for public routes, added interactive sidebar regression coverage, synchronized story metadata with current route ownership, and returned the story to done.
- 2026-03-16: Completed follow-up review remediation by protecting `/booking/*` in middleware auth routing, adding booking callback redirect regression coverage, and improving sidebar logout button touch targets; story remains done.
- 2026-03-16: Completed follow-up review remediation by switching middleware auth protection to public-route detection, adding shell landmark/skip-link regression coverage, normalizing story paths to repo-relative form, and clarifying cumulative file-list provenance; story remains done.
- 2026-03-16: Ran a full verification rerun for Story 1.4, tightened AC6 test coverage with explicit skip-link/focus-token assertions, and expanded story traceability notes for current-worktree review evidence.
- 2026-03-16: Reopened the story to review for remediation, removed Prisma-backed middleware session validation, restored validated-session redirects to server `auth()` entry points, replaced the implicit auth-routing denylist with an explicit public-route registry plus future-route tests, corrected Task 4 and architecture notes to match the current stack, reran validation, and returned the story to done.
- 2026-03-18: Reopened Story 1.4 for authenticated shell remediation, fixed full-viewport shell/sidebar behavior, separated Reservations from admin All Bookings routing, added regression coverage for route separation and shell sizing, reran validation, and moved the story to review.
