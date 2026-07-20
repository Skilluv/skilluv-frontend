# Changelog

All notable changes to the Skilluv frontend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **A11y hardening** — 10 of 12 preexisting `svelte-check` warnings resolved (labels without controls converted to `<p>` on non-form contexts, SCIM token input wired to its label via `id`/`for`, MultiSelect chip remove-button lifted out of the outer button as `<span role="button">`). 2 remaining warnings live on the deactivated terminal module (`TerminalConfirm`, `TerminalEmulator`) which is dead code slated for later reactivation — documented in FEATURE-MATRIX cross-cutting quality row.
- **axe-core in Playwright** — new `@axe-core/playwright` dev-dep + `tests/e2e/utils/a11y.ts` helper `expectNoSeriousA11yViolations()` that fails on any WCAG 2 A/AA critical or serious violation. Wired into the profile-badges e2e as the first coverage point; other suites can adopt it via a one-line import.
- **Lighthouse CI mobile** — new job in `.github/workflows/ci.yml` running `@lhci/cli` against 3 representative URLs (`/`, `/challenges`, `/pricing`) with mobile emulation. Assertions: accessibility ≥ 0.9 (error), performance/best-practices/SEO warnings at 0.7 / 0.85 / 0.85. Config in `lighthouserc.json`, results uploaded to LHCI temporary public storage.
- **Sentry sourcemaps CI step** — conditional on `SENTRY_AUTH_TOKEN` secret. Injects sourcemaps into the build, creates the release keyed on the short SHA, uploads sourcemaps, finalizes. No-op when the secret is absent (opt-in, matches the runtime observability shell in `src/lib/observability.ts`).
- **README.fr.md MVP block** — top-level status block mirroring the English README (11 phases livrées, feature bullets, link to CHANGELOG + FEATURE-MATRIX, i18n scope narrowed to FR + EN).

### Removed
- Arabic locale (`ar.ts`) and RTL support — maintenance cost was outweighing the audience benefit for the current MVP scope. `ar` is no longer offered in the settings language picker, dropped from `Locale`, removed from `RTL_LOCALES` (direction is now always `ltr`), and removed from the `i18n:check` script. The `ar` value in the enterprise talents' spoken-languages catalog is data, not UI locale, and stays untouched.

---

## [0.3.0] — 2026-07-16 — MVP-ready

Full MVP shipped in 11 sequential phases (FE-M1 → FE-M11) — see per-phase notes below. 120 unit + e2e tests green, 0 svelte-check errors, FR/EN at parity (537 referenced keys against 736 per locale), Docker + CI pipeline in place, observability + retry hardening on top of the existing app.

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

**FE-M11 — Tests + docs + deploy + hardening**
- `client.ts` — safe-methods (GET/HEAD) auto-retry on network throw only (backoff 1s / 3s / 9s, 3 retries). Writes never auto-retry — user-driven for explicit intent. Server-side errors (5xx) surface immediately (MVP §0.11).
- `src/lib/observability.ts` — Sentry + PostHog opt-in via `PUBLIC_SENTRY_DSN` / `PUBLIC_POSTHOG_KEY` env vars, graceful no-op in dev/without SDKs installed. Wired at app boot from root layout (MVP §0.9).
- CI (`.github/workflows/ci.yml`) — new `e2e` job running Playwright with Chromium + failure report upload, plus `i18n:check` step on the main check job.
- `scripts/i18n-check.mjs` — CLI verifying FR/EN/AR parity + hunting orphan and missing keys (fails CI on any violation). Currently reports 537 referenced keys with 736 keys per locale.
- `docker-compose.frontend.yml` — standalone service compose with healthcheck, `host.docker.internal` bridge, all `PUBLIC_*` env vars wired.
- `README.md` — MVP-ready badge, expanded feature list (badges wall, moderation surfaces, wallet flows, events, privacy, Web Push VAPID, 3 languages), Docker + testing quick-start sections.
- `FEATURE-MATRIX.md` (new) — per-phase mapping of backend phases (P4→P25) to frontend implementation status + cross-cutting quality checklist.
- `ENTERPRISE-CAPABILITIES.md` — MVP addendum block covering P24 enterprise types + P18.4 capabilities frontend surfaces.
- 4 unit tests on the retry policy (retry-then-succeed, exhaustion, POST no-retry, 5xx no-retry).

**FE-M8 — Talent wallet + payouts**
- `<WalletBalanceCard>` — fragments balance + EUR equivalent + last-updated timestamp + "Request payout" CTA (disabled below the 100-fragment minimum).
- `<TransactionRow>` — history row with type icon (earn / payout / adjustment), amount, description, truncated `entry_hash` display (hash-chained audit).
- `<PayoutRow>` — payout row with status badge (5 states) + settled_at + failure_reason + currency-formatted amount + fragment count.
- `<PayoutRequestModal>` — full flow: amount input with minimum validation, method radio (Stripe / Mobile Money), Stripe status/connect-onboarding sub-flow, Mobile Money provider (Orange/MTN) + number registration + verification.
- New page `/wallet` — balance + history + payouts sections with `Promise.allSettled` guards + open-modal + refresh-after-submit.
- New pages `/wallet/stripe/return` (post-onboarding success with auto-redirect) and `/wallet/stripe/refresh` (expired-link recovery hitting `stripeOnboarding` again).
- i18n FR/EN/AR — `wallet.*` namespace: title/subtitle, balance labels with interpolation, history/payouts empty states, 3 transaction kinds, 5 payout statuses, full modal (amount, method cards, Stripe sub-flow, Momo sub-flow, submit/cancel, submitted toast).
- 8 unit tests covering read routes (balance / history pagination / payouts pagination), Stripe flow (status / onboarding URL / requestPayout with account_id), Mobile Money flow (register / requestPayout with provider+number).
- 3 Playwright e2e — balance + history render, payout modal + Stripe status, Mobile Money method switch reveals operator + number fields.

**FE-M9 — Community moderation inline**
- `<ConfirmDangerousDialog>` — reusable modal with required-reason input, danger CTA, cancel guard while submitting.
- `<InlineModerateButton>` — capability-gated dropdown menu (only renders when `auth.can(capability)` is true) with role="menu" a11y wiring.
- Forum post moderation — inline dropdown on `/forum/[id]` with 3 actions (delete, mark spam, mute author) + mute-duration selector overlay (24h / 3d / 7d).
- New curator queue `/community/curator` — lists pending community challenges, approve (optional reason) / reject (required reason) actions gated on `community_curator` or `admin`.
- New reviewer queue `/moderation/plagiarism` — flagged deliverables (with backend-computed score), mark-valid / revoke actions with required reason, gated on `plagiarism_reviewer` or `admin`.
- Extended `communityApi` with `pendingReview()` reading `/community/challenges/review`.
- i18n FR/EN/AR — `moderation.*` namespace covering shared labels (reason, cancel, confirm, toasts), forum actions + mute durations, community approve/reject dialogs, plagiarism queue labels + confirm dialogs.
- 8 unit tests covering all `moderationApi` routes (forum × 2, community × 2, plagiarism × 3) and `communityApi.pendingReview` + 2 Playwright e2e (curator approve happy path, non-curator forbidden guard).

**FE-M10 — Events + privacy/GDPR + season indicator**
- New `privacyApi` module — GET/PATCH `/users/me/consents` (marketing + analytics), POST `/users/me/gdpr-export` (RGPD legal dump), POST `/users/me/data-export` (product bundle), GET `/users/me/exports/{jobId}` (poll), POST `/users/me/delete` (30-day soft delete).
- `<EventCard>` — reusable card with status derivation (active/upcoming/ended) + partner badge + start/end dates.
- New pages `/events` (list + "My events" section with earned-stamp badges) and `/events/[slug]` (detail + join lifecycle with authenticated gate).
- New page `/settings/privacy` — consent toggles (marketing + analytics), GDPR export request/poll/download, product data export, account deletion with confirmation modal and reason field.
- `/leaderboards` — current season banner (link to /tournaments) with name + end date, loaded from `tournamentApi.currentSeason` with silent fallback.
- i18n FR/EN/AR — `events.*` (16 keys), `privacyPage.*` (nested consents/gdpr/dataExport/delete), `seasons.*` namespace.
- 7 unit tests (privacyApi 5 routes + badgeEventsApi 4 routes + currentSeason) + 2 Playwright e2e (events list render + join lifecycle).

**FE-M7 — Web Push VAPID polish**
- Service worker `/service-worker.js` now forwards push payloads to a focused client via `postMessage` instead of firing a redundant OS-level notification; background pushes still surface as native notifications.
- New `<PushForegroundListener>` component mounted in the root layout — listens for `serviceWorker` message events, shows an in-app toast, and refreshes the notifications badge count.
- `<PushToggle>` migrated from hardcoded FR/EN string ternaries to `i18n.t()` keys covering all states (on / off / blocked / unsupported / toasts).
- i18n FR/EN/AR — new `push.*` namespace with title, category, description, status badges, buttons, block hint, unsupported message, and 4 toast keys.
- 9 unit tests: `urlBase64ToUint8Array` decode / URL-safe / padding, `arrayBufferToBase64Url` round-trip / null handling / padding stripping, `pushApi` VAPID / subscribe / unsubscribe route verification. Playwright coverage deferred to FE-M11 CI hardening — the SW + Notification API pair does not mock reliably in headless browsers.

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
