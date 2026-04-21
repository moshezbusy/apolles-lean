Read `AGENTS.md`, `DESIGN.md`, and `PAGE_SPECS.md` before doing anything else.

Then create or improve a page in this repository using the existing product design language.

Requirements:

1. Inspect the closest existing routes in `app/` first.
2. Inspect shared components before creating new ones.
3. Reuse the closest current visual reference.
4. Treat `/home` as the main visual anchor for inner app pages.
5. Treat `/login` as a separate visual mode and do not spread its style into inner app pages.
6. Do not introduce a new design style, new visual language, or trend-driven styling.
7. Reuse patterns for layout, spacing, typography, buttons, forms, cards, tables, and badges.
8. Prefer reusable components and extensions of current patterns over one-off code.
9. Keep booking data, pricing, cancellation policy, dates, and reservation references visually clear.
10. If a new pattern is unavoidable, make it feel like a direct extension of the current system.

Execution steps:

1. Identify the target route and its role.
2. Read the relevant section in `PAGE_SPECS.md`.
3. Inspect the nearest existing pages and shared components.
4. State which current page or component is the primary visual reference.
5. Implement the smallest correct UI change that fits the established system.
6. Avoid redesigning unrelated pages.
7. Summarize what was reused versus what was newly introduced.

Output expectations:

1. Keep the result consistent with the current prototype.
2. Do not treat the task as a greenfield design exercise.
3. Favor standardization over novelty.
