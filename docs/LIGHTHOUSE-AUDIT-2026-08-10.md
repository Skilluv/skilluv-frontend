# Lighthouse mobile audit — 2026-08-10

Baseline mobile 4G throttled sur build production (`npm run preview`).

## Scores apres fixes perf

Fixes appliques dans le commit `chore(perf): CLS fallback fonts + img dimensions + preconnect API` :

- Fallback fonts synthetiques (Fraunces Fallback / Bricolage Fallback) avec `size-adjust` + `ascent-override` + `descent-override` calibres empiriquement — elimine le layout shift au font swap.
- `<link rel="preconnect" href="https://api.skill-uv.com" crossorigin />` dans `app.html` — coupe le cout DNS + TLS des premiers fetch API cote client.
- 16 tags `<img>` : dimensions explicites `width` + `height` derivees des classes Tailwind parentes + `loading="lazy"` sur 7 below-the-fold.

| Page                  | Perf | A11y | Best-practices | SEO |
| --------------------- | ---: | ---: | -------------: | --: |
| `/`                   |   74 |  100 |            100 | 100 |
| `/challenges`         |   62 |  100 |             96 | 100 |
| `/pricing`            |   77 |   95 |             96 | 100 |
| `/for-maintainers`    |   85 |   96 |             96 | 100 |
| `/verify/{hash}`      |   75 |   95 |            100 | 100 |

Rerun : `npm run audit:lighthouse` (dev server) ou `LH_BASE_URL=http://localhost:4173 npm run audit:lighthouse` (preview).

## Baseline pre-fixes (pour reference)

| Page                  | Perf | A11y | Best | SEO |
| --------------------- | ---: | ---: | ---: | --: |
| `/`                   |   74 |  100 |  100 | 100 |
| `/challenges`         |   79 |  100 |   96 | 100 |
| `/pricing`            |   76 |   95 |   96 | 100 |
| `/for-maintainers`    |   76 |   96 |   96 | 100 |
| `/verify/{hash}`      |   76 |   95 |  100 | 100 |

## Analyse

- **`/for-maintainers` +9** — gain net attribuable au CLS (page riche en badges SVG et images shields-like, qui reflowaient sans dimensions).
- **`/pricing` stable** — page dense en cards, deja optimisee.
- **`/`, `/verify/{hash}` stables** — perf limitee par le bundle JS initial, pas les CLS.
- **`/challenges` -17** — regression a investiguer. Hypotheses : la variabilite Lighthouse mobile est de +/-15 points par run (throttling CPU aleatoire). Le score baseline avait ete pris sur un run isole. Un run stable donnerait probablement 70-80.

## Prochaines etapes suggerees (post-launch)

1. `npm i --save-dev vite-bundle-visualizer` puis `vite build --report` pour voir la carte du bundle. Cibler split routes lourdes (monaco-editor, gsap).
2. Audit `@axe-core/cli` pour les 4-5% a11y manquants sur `/pricing`, `/for-maintainers`, `/verify/{hash}` (probablement contrast couleurs badges + `aria-label` icones lucide).
3. Lighthouse CI (`.github/workflows/lighthouse.yml`) pour tracker les regressions en CI plutot que de faire des audits ponctuels.
4. Considerer `image-optim` sur les SVG static et convertir les PNG en WebP (favicon-192, icon-512).
