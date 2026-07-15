# Changelog

Toutes les modifications notables du frontend Skilluv sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Added
- _(à compléter au fil des prochaines implémentations)_

### Changed
- _(à compléter)_

### Fixed
- _(à compléter)_

### Removed
- _(à compléter)_

---

## [0.2.0] — 2026-07-15 — Design System v2

### Added
- **Design System v2** : refonte typographique (Fraunces + Bricolage Grotesque) et réalignement des 5 thèmes.
- **Système de badges** : composants scout badges + playground design-system.
- **Coloration catégorielle par route** : application globale via `data-route`, scoping propre sur `<main>`.
- **Empty States** : composant `EmptyState` scout appliqué à 7 pages clés.
- **Wordmark sKIL·LUV** : intégration dans la navbar, la page profil (Keyring) et l'onboarding.
- **Refonte enterprise workspace** : wordmark + Fraunces + ambiance « understand ».
- **Première impression auth/onboarding** : wordmark, ambiance craft, Fraunces.

### Changed
- Palettes reconstruites avec échelle de luminance claire et surfaces chromatiques affirmées.
- Tokens de surface catégoriels appliqués sur les composants landing.
- Sync `neon` → `vesperal` dans `EnterpriseHeader`.

### Fixed
- 11 erreurs `svelte-check` résolues.
- Chargement des polices : override direct de `--font-sans` dans `:root` unlayered, littéraux hardcodés en fallback final.
- Découpage `@theme` conforme à la spec Tailwind v4 (standard + inline).
- Move `@const` en tête de bloc dans le feed.

---

## Guide de contribution au changelog

À chaque nouvelle implémentation, ajouter une ligne dans la section `[Unreleased]` sous la catégorie appropriée :

- **Added** — nouvelle fonctionnalité
- **Changed** — modification d'une fonctionnalité existante
- **Deprecated** — fonctionnalité bientôt supprimée
- **Removed** — fonctionnalité supprimée
- **Fixed** — correction de bug
- **Security** — correctif de sécurité

Au moment d'une release, renommer `[Unreleased]` en `[X.Y.Z] — YYYY-MM-DD` et recréer une section `[Unreleased]` vide au-dessus.
