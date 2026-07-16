# Feature matrix — backend phases × frontend coverage

Snapshot of the Skilluv frontend MVP surface, mapped to the backend phases that produced each contract. Updated at the close of the FE-M1 → FE-M11 MVP push.

Legend:
- **Livré** — frontend implementation shipped, tests + i18n + a11y in place.
- **Partiel** — surface exists but relies on legacy data (backend upgrade planned).
- **Backend** — the backend endpoint is expected but not yet exposed by `skilluv-backend`. See [BACKEND-GAPS.md](docs/BACKEND-GAPS.md) for the exact contracts.

---

## Backend phase coverage

| Backend phase | Domain                          | Frontend surface(s)                                                                         | Status  |
|---------------|---------------------------------|---------------------------------------------------------------------------------------------|---------|
| P4            | GDPR / consents / account       | `/settings/privacy` (consents, GDPR + data export, delete)                                  | Livré   |
| P4-P5         | Auth (register / login / MFA)   | `/auth/register`, `/auth/login`, `/auth/verify-email`, WebAuthn, TOTP, magic link           | Livré   |
| P5            | Profile + challenges base       | `/profile/[username]`, `/challenges`, `/challenges/onboarding`, sandbox                     | Livré   |
| P6            | Seasons + tournaments           | `/leaderboards` (season banner), `/tournaments`, `/tournaments/[slug]` (register + board)   | Livré   |
| P10 + P15.3   | Teams + role slots + marketplace| `/teams/marketplace` (filters + join), `/teams/[team_id]` (open + filled slots)             | Livré   |
| P13           | Talent wallet + payouts         | `/wallet` (balance, history, payouts) + Stripe Connect + Mobile Money flows                 | Livré   |
| P15.1         | Push notifications (VAPID)      | `PushToggle`, service worker, foreground `postMessage` → in-app toast + badge refresh       | Livré   |
| P16           | Career orientations             | `/onboarding/orientations` + soft-block banner + profile chips + selector cap-3             | Livré   |
| P17           | Badges Proof Engine + rank      | `BadgesWall` on profile (rank chevron + patches + medals + crests + counters)               | Livré   |
| P17.6         | Skilluv events + stamps         | `/events` + `/events/[slug]` (join + stamp badge)                                           | Livré   |
| P18.4         | Capabilities                    | `AuthState.can()`, `CapabilityBadge`, `ContributionSection`, conditional navbar links       | Livré   |
| P24           | Enterprise types + agency       | Register step 3 (type wizard), `/enterprise/agency-clients` CRUD, dashboard conditional cards | Livré |
| P25           | Community moderation inline     | `InlineModerateButton` on forum posts, `/community/curator` queue, `/moderation/plagiarism` | Livré + backend refactor pending (`require_any_capability`) |

---

## Cross-cutting quality

| Concern            | Implementation                                                                                         | Status  |
|--------------------|--------------------------------------------------------------------------------------------------------|---------|
| Types              | `src/lib/types/index.ts` — 100 % typed against backend contracts (P16-P25 additions)                   | Livré   |
| i18n               | FR + EN at parity, verified by `npm run i18n:check` in CI                                              | Livré   |
| Retries / offline  | GET/HEAD auto-retry on network throw (1s / 3s / 9s), writes fail fast for user-driven retry (§0.11)   | Livré   |
| Observability      | Sentry + PostHog opt-in via env, graceful no-op mode (§0.9)                                            | Livré   |
| Accessibility      | Native `<label>`, `role="menu"`/`aria-*` on custom dropdowns, focus trap via `Modal` component         | Livré   |
| Tests              | 12+ unit files (~120 tests), 6 e2e Playwright suites (onboarding, badges, teams, events, wallet, moderation) | Livré |
| Design system      | Fraunces + Bricolage Grotesque, 5 themes × dark/light, scout badge components, category route coloring | Livré (v0.2.0) |
| Docker             | Multi-stage image (~50 MB), non-root, healthcheck, `docker-compose.frontend.yml`                       | Livré   |
| CI                 | `check` (svelte-check, build, unit, i18n) + `e2e` (Playwright)                                         | Livré   |

---

## What ships now vs later

**Ships now (MVP-ready)** :
- Everything in the matrix above.
- Full end-to-end coverage from signup → orientations → challenges → badges → wallet payout.
- Moderation surfaces for `forum_moderator`, `community_curator`, `plagiarism_reviewer`.

**Explicitly out of MVP** :
- Bulk moderation actions (single-item only for MVP).
- Backend admin panel — lives in the separate `skilluv-admin` repo.
- Skill tree visualization (post-MVP Tier 3 backlog, ~2-3 weeks D3.js work).
- Onboarding gamification / rank-up animations / audio.
- Storybook — the `/design-system/badges` playground covers the same need.

**Backend follow-ups tracked in `docs/BACKEND-GAPS.md`** :
- `GET /api/users/{id}/orientations` (public projection).
- `GET /api/community/challenges/review` (curator queue).
- `require_any_capability(...)` refactor on 5 moderation routes (~2 days backend).
