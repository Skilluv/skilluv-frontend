# Changelog

All notable changes to the Skilluv frontend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**FE-M1 — Types + API modules P16-P25**
- Extended `types/index.ts` with 20+ new interfaces (Orientation, UserOrientation, Capability, UserCapability, Rank, BadgeItem, UserBadgesResponse, BadgeRule, BadgeEvent, EnterpriseType, TypeConfigStaffing/RemoteIntl, AgencyClient, TeamRoleSlot, TeamMarketplaceSlot, WalletBalance, WalletTransaction, PayoutRequest) plus re-exports from `badges/types.ts` as single source of truth.
- Extended `UserPrivate` with `capabilities`, `orientations`, `rank`, `enterprise_type`.
- Migration helper `rankFromTitle()` for smooth Title (legacy P5) → Rank (P17) transition.
- 9 new API modules: `orientations`, `capabilities` (with reusable `hasCapability()` helper), `badges`, `wallet`, `team_marketplace`, `agency_clients`, `enterprise_types`, `badge_events`, `moderation` (namespaced forum/community/plagiarism). All follow the existing `push.ts` pattern.
- 36 unit tests covering signatures, routes, payloads, expiry logic.

**FE-M4 — Capabilities UI**
- `AuthState.capabilities` + `can(cap)` getter + `refreshCapabilities()` for standalone reload.
- `<CapabilityBadge>` — reusable component wrapping existing `ui/Badge`, mapping icon + variant per capability, native tooltip.
- `<ContributionSection>` — public/own profile section listing active capabilities, filtering expired.
- Navbar user dropdown — 5 conditional links (forum moderation, curator queue, plagiarism review, mentor zone, tournament jury) driven by `auth.can(...)`.
- i18n FR/EN/AR — 14 capability labels + descriptions + navigation entries.

**FE-M5 — Team marketplace + role slots**
- `<RoleBadge>` — reusable role indicator built on top of `ui/Badge`.
- `<SlotCard>` — marketplace slot card with team name, challenge link, role badge, min-level, required skill, join CTA + view-team link.
- `<FillSlotDialog>` — confirmation modal with slot summary, skill-check row, and low-level warning shown when user proficiency is below `min_proficiency_level`.
- New page `/teams/marketplace` — paginated list of open slots with filters (role, skill, min/max difficulty) + reset + soft-block for users without orientation + empty states (filtered vs no filters).
- New page `/teams/[team_id]` — open vs filled slot sections + fill/leave lifecycle with per-slot loading indicator.
- i18n FR/EN/AR — marketplace title/subtitle, filter labels, empty states, dialog copy (fill + leave), detail labels (min level, skill required, filled badge).
- 5 unit tests (filter serialization, slot lifecycle, createSlot payload) + 3 Playwright e2e (marketplace render, join flow, orientation soft-block).

**FE-M6 — Enterprise types + agency clients**
- `<EnterpriseTypeCard>` — 3 visual cards (direct_hire, staffing_agency, remote_international) with icon + label + description + 3 benefits, aria-pressed state.
- `<EnterpriseTypeSelector>` — fieldset wrapper with grid of cards + bindable value + onchange callback.
- `/enterprise/register` — new step 3 inserted between company and TOTP setup, PATCHes `/enterprises/me/type-config` on submit, skippable (keeps backend default direct_hire).
- New page `/enterprise/agency-clients` — full CRUD (list + create + edit + archive + restore) for staffing_agency accounts, with owner-only guard message for other enterprise types.
- `/enterprise/dashboard` — conditional cards: link to agency-clients management for staffing_agency, EOR configuration summary (provider / currency / timezone / tax country) for remote_international.
- i18n FR/EN/AR — full parity for types (labels + 3 benefits each), agency clients CRUD, EOR configuration, dashboard cards, register step 3.
- 4 unit tests (enterpriseTypesApi get/patch payload, agencyClientsApi CRUD lifecycle) + 2 Playwright e2e (add client + owner-only guard).

**FE-M2 — Onboarding orientations**
- `<OrientationCard>` — reusable visual card (domain dot, name, description, tags, selection state, disabled state, link/button dual mode).
- `<OrientationSelector>` — grid + domain filter + cap-3 enforcement + primary radio + mode toggle (learning/active) + working languages + timezone inputs + submit with validation.
- `<OrientationPromptBanner>` — sticky non-blocking banner in root layout for authenticated candidates with zero orientations (soft-block, per MVP §0.7 — no interstitial modal).
- `<OrientationSoftBlock>` — full-screen prompt for pages that require an orientation, drop-in reusable.
- New pages `/onboarding/orientations` (catalog + selector + confirmation) and `/onboarding/orientations/[slug]` (detail + playlist preview with graceful fallback).
- `AuthState.refreshOrientations()` + orientations loaded in parallel with capabilities during `init()`.
- Post-signup flow updated: `complete-profile` now routes to `/onboarding/orientations` instead of `/challenges/onboarding`.
- Hooks server allowlist extended so unfinished users can reach the orientations picker.
- i18n FR/EN/AR — full parity for selector, banner, soft-block, catalog, detail (playlist labels included).
- 4 unit tests on orientations lifecycle + 4 Playwright e2e covering catalog render / domain filter / 3-orientation cap / submit confirmation.

**FE-M3 — Badges profile display**
- `<BadgesWall>` — rank chevron + skill patches wall + medals + guild crests + seals/stamps counters + empty state, all connected to `UserBadgesResponse`.
- `<OrientationList>` — user orientations chip list (primary + secondary + working languages + timezone).
- `/profile/[username]` refactored to consume `badgesApi.forUser`, `orientationsApi.forUser`, `capabilitiesApi.forUser` via `Promise.allSettled` (tolerant of missing backend endpoints).
- Extracted `src/lib/utils/badges.ts` with pure utilities `hashSlug`, `derivePatchVisual`, `RANK_TO_LEVEL`, `PATCH_CATEGORIES`, `PATCH_KEY_TYPES` — reusable and unit-testable.
- i18n FR/EN/AR — badges sections, rank labels (ranger + doyen added), orientations, empty states.
- 7 additional unit tests on badge utilities.
- Playwright e2e `profile-badges.test.ts` covering identity + rank + patches + medals + counters + orientations + contribution section rendering.
- New tracker `docs/BACKEND-GAPS.md` documenting all expected backend endpoints per FE phase with contract and fallback behavior.

### Changed
- `AuthState.init()` now loads capabilities in cascade after `/auth/me`.
- `AuthState.logout()` / `clear()` reset capabilities.
- BadgesWall replaces the previous client-side patch derivation on the profile page (which hacked SkillPatch cycling from generic P5 badges).

### Fixed
- Missing `ranger` and `doyen` translations in `common.titles` — added to FR/EN/AR.

---

## [0.2.0] — 2026-07-15 — Design System v2

### Added
- **Design System v2**: typography overhaul (Fraunces + Bricolage Grotesque) and realignment of the 5 themes.
- **Badge system**: scout badge components + design-system playground.
- **Per-route categorical coloring**: applied globally via `data-route`, properly scoped to `<main>`.
- **Empty states**: scout `EmptyState` component applied to 7 key pages.
- **sKIL·LUV wordmark**: integrated in the navbar, profile page (Keyring), and onboarding.
- **Enterprise workspace redesign**: wordmark + Fraunces + "understand" ambiance.
- **Auth/onboarding first impression**: wordmark, craft ambiance, Fraunces.

### Changed
- Palettes rebuilt with a clear luminance ladder and bold chromatic surfaces.
- Categorical surface tokens applied across landing components.
- Sync `neon` → `vesperal` in `EnterpriseHeader`.

### Fixed
- 11 `svelte-check` errors resolved.
- Font loading: direct `--font-sans` override in unlayered `:root`, hardcoded literals as final fallback.
- `@theme` split compliant with Tailwind v4 spec (standard + inline).
- Moved `@const` to top of block in the feed.

---

## Changelog contribution guide

For every new implementation, add a line under the `[Unreleased]` section in the appropriate category:

- **Added** — new feature
- **Changed** — change to an existing feature
- **Deprecated** — feature soon to be removed
- **Removed** — feature removed
- **Fixed** — bug fix
- **Security** — security fix

At release time, rename `[Unreleased]` to `[X.Y.Z] — YYYY-MM-DD` and create a fresh empty `[Unreleased]` section above it.
