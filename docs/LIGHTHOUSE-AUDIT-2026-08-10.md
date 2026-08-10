# Lighthouse mobile audit — 2026-08-10

Baseline mobile 4G throttled sur build production (`npm run preview`).

## Scores

| Page                  | Perf | A11y | Best-practices | SEO |
| --------------------- | ---: | ---: | -------------: | --: |
| `/`                   |   74 |  100 |            100 | 100 |
| `/challenges`         |   79 |  100 |             96 | 100 |
| `/pricing`            |   76 |   95 |             96 | 100 |
| `/for-maintainers`    |   76 |   96 |             96 | 100 |
| `/verify/{hash}`      |   76 |   95 |            100 | 100 |

Rerun : `npm run audit:lighthouse` (dev server) ou `LH_BASE_URL=http://localhost:4173 npm run audit:lighthouse` (preview).

## Insights & actions

### Performance 74-79 (mobile, cible 90+)

**Le plus impactant** — 3 metriques sous 0.5 sur `/` :

1. **First Contentful Paint** (score 0.17) → FCP ~3-4s. Cause : bundle JS initial trop lourd + fonts loading render-blocking.
   - **Action** : `<link rel="preload" href="/fonts/*.woff2" as="font" crossorigin>` dans `app.html`.
   - **Action** : audit bundle size via `vite build --report`.

2. **Largest Contentful Paint** (score 0.39) → LCP ~3s. Cause : image hero + font swap.
   - **Action** : `<link rel="preload" as="image" href="/hero.webp">` sur landing.
   - **Action** : `font-display: optional` sur Fraunces WONK (voir `app.css`).

3. **Cumulative Layout Shift** (score 0.0 → CLS haut) — le plus grave. Cause : elements qui se decalent au chargement.
   - **Action** : dimensions explicites `width`/`height` sur toutes les `<img>` (SEO + a11y aussi).
   - **Action** : reserver espace avec `min-height` sur les slots dynamiques (widgets P26, orientations banner).
   - **Action** : `font-display: swap` -> `font-display: optional` pour eviter FOUT.

### Accessibility 95-96 (cible 100)

3 pages sous 100 : `/pricing`, `/for-maintainers`, `/verify/{hash}` — toutes des pages P26 nouvelles (sauf pricing).

Verifier avec `npx @axe-core/cli http://localhost:4173/pricing` :
- Contrast couleurs sur les badges/pills probablement (ratio < 4.5:1).
- `aria-label` manquants sur les icones lucide utilisees sans texte.

### Best-practices 96 (cible 100)

3 pages sous 100. Causes typiques :
- `console.error` en prod (verifie via `handleError` dans hooks.client.ts).
- Erreurs images (aspect ratio incorrect, chargement fail silencieux).

### SEO 100 partout

Rien a faire.

## Prochaines etapes suggerees (post-launch)

1. `npm i --save-dev vite-bundle-visualizer` puis `vite build --report` pour voir la carte du bundle.
2. Ajouter `preload` fonts + hero image dans `app.html`.
3. Passer les fonts Fraunces en `font-display: optional`.
4. Audit `@axe-core/cli` pour cibler les 4-5 percent de a11y manquants.
5. Refaire un audit apres ces fixes.
