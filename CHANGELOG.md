# Changelog

All notable changes to the Skilluv frontend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- _(to be filled as new implementations land)_

### Changed
- _(to be filled)_

### Fixed
- _(to be filled)_

### Removed
- _(to be filled)_

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
