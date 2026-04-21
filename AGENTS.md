# Project UI Rules

This repository is a visual prototype for a lean B2B hotel booking engine for travel agents. It is used to design, preview, refine, and standardize pages before transferring decisions into the real implementation.

This repo is not a blank canvas. New UI work must extend the existing product language already established in the current pages and shared components.

## Required Reading

Before any major UI work, read:

1. `AGENTS.md`
2. `DESIGN.md`
3. `PAGE_SPECS.md`

Major UI work includes creating a page, redesigning a page section, introducing a new reusable pattern, changing layout structure, or adding a new state-heavy workflow.

## Core Rules

1. Reuse existing patterns before creating new ones.
2. Do not invent a new design language for this repo.
3. Do not introduce a new visual direction because a page feels empty or because a request is underspecified.
4. Match the existing product character and the strongest current internal references.
5. Prefer extending shared components over creating one-off page-specific styling.
6. Keep changes minimal, consistent, and production-minded.

## Visual Anchors

1. `/home` is the main visual anchor for inner app pages.
2. Inner app pages should align with `/home`, then with adjacent workflow pages such as search, booking, and reservations.
3. `/login` is intentionally separate from the inner app visual language.
4. Do not spread the `/login` split-screen marketing-style treatment into inner app pages.
5. Do not redesign `/login` to resemble dashboard pages unless explicitly requested.

## Consistency Requirements

Maintain consistency across all current and future app pages for:

1. Spacing rhythm and section density
2. Typography scale, weight, and heading hierarchy
3. Buttons and interactive emphasis
4. Inputs, selects, textareas, and form labels
5. Cards, bordered containers, and summary panels
6. Tables, row density, and alignment rules
7. Status badges, semantic colors, and label casing
8. Empty states, loading states, and summary headers

## Pattern Reuse Rules

1. Inspect existing pages and shared components before adding a new pattern.
2. If an existing pattern solves at least 70 percent of the need, reuse or adapt it.
3. If a new pattern is necessary, make it feel like an obvious member of the same system.
4. New patterns must inherit the current spacing, typography, border radius, border color, neutral palette, and interaction style.
5. Avoid page-specific flourishes that cannot be reused.

## Interaction and Layout Rules

1. Inner app pages should favor clear operational layouts over expressive or promotional compositions.
2. Important actions should be easy to locate and visually stable across pages.
3. Booking data, pricing, cancellation policies, dates, and reservation references must be easy to scan.
4. Do not hide critical operational data behind decorative treatments.
5. Prefer clarity, alignment, and hierarchy over novelty.

## What To Avoid

1. Flashy marketing-style hero treatments inside app pages
2. New accent color systems without a concrete existing reference
3. Oversized headings or oversized empty-space compositions in operational screens
4. Decorative gradients, glassmorphism, floating widgets, or trend-driven styling
5. Mixing multiple card styles, button styles, or badge systems on the same workflow

## Execution Expectation

When asked to create or improve a UI page:

1. Read the required instruction files first.
2. Inspect the closest existing route and shared components.
3. Use the nearest current visual reference.
4. Reuse patterns before proposing anything new.
5. Keep the repository visually unified.
