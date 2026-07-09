# Skilluv Frontend

Skilluv est une plateforme competitive de challenges techniques couvrant quatre domaines : code, design, game et security. Ce depot contient le frontend de l'application, construit avec SvelteKit 2, Svelte 5, Tailwind CSS 4 et TypeScript.

---

## Table des matieres

- [Prerequis](#prerequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts disponibles](#scripts-disponibles)
- [Architecture du projet](#architecture-du-projet)
- [Routing](#routing)
- [Systeme de themes](#systeme-de-themes)
- [Internationalisation](#internationalisation)
- [Tests](#tests)
- [Deploiement](#deploiement)
- [Stack technique](#stack-technique)

---

## Prerequis

- Node.js 22 ou superieur
- npm 10 ou superieur
- Un backend Skilluv en cours d'execution sur le port 3001 (pour le developpement local)

---

## Installation

```bash
git clone <url-du-depot>
cd skilluv-frontend
npm ci
```

---

## Configuration

Copier le fichier d'exemple et ajuster les valeurs si necessaire :

```bash
cp .env.example .env
```

Variables d'environnement :

| Variable    | Description                              | Valeur par defaut            |
|-------------|------------------------------------------|------------------------------|
| `API_URL`   | URL interne du backend (server-side only) | `http://localhost:3001/api` |

En production, les variables suivantes sont egalement utilisees (voir le Dockerfile) :

| Variable    | Description               | Valeur par defaut       |
|-------------|---------------------------|-------------------------|
| `NODE_ENV`  | Environnement d'execution | `production`            |
| `PORT`      | Port d'ecoute du serveur  | `3000`                  |
| `HOST`      | Adresse d'ecoute          | `0.0.0.0`              |
| `ORIGIN`    | Origine publique du site  | `https://skilluv.com`  |

En developpement, Vite proxifie automatiquement les requetes `/api` et `/ws` vers `http://localhost:3001`.

---

## Scripts disponibles

| Commande              | Description                                          |
|-----------------------|------------------------------------------------------|
| `npm run dev`         | Lance le serveur de developpement Vite               |
| `npm run build`       | Compile l'application pour la production             |
| `npm run preview`     | Previsualise le build de production localement       |
| `npm run check`       | Verifie les types TypeScript et la syntaxe Svelte    |
| `npm run check:watch` | Idem en mode watch                                   |
| `npm test`            | Execute les tests end-to-end (Playwright)            |
| `npm run test:unit`   | Execute les tests unitaires (Vitest)                 |
| `npm run test:unit:watch` | Execute les tests unitaires en mode watch        |

---

## Architecture du projet

```
src/
├── routes/                     Routing SvelteKit (file-based)
│
├── lib/
│   ├── api/                    Modules client HTTP
│   │   ├── client.ts           Client de base avec gestion d'erreurs
│   │   ├── auth.ts             Authentification
│   │   ├── challenges.ts       Challenges
│   │   ├── profile.ts          Profils utilisateurs
│   │   ├── enterprise.ts       Fonctionnalites entreprise
│   │   └── ...                 Autres modules API
│   │
│   ├── stores/                 Stores reactifs (Svelte 5 runes)
│   │   ├── auth.svelte.ts      Etat d'authentification
│   │   ├── theme.svelte.ts     Gestion des themes
│   │   ├── notifications.svelte.ts
│   │   ├── websocket.svelte.ts Evenements temps reel
│   │   └── toast.svelte.ts     Notifications toast
│   │
│   ├── components/             Composants reutilisables
│   │   ├── layout/             Navbar, BottomBar
│   │   ├── ui/                 Button, Input, Modal, Badge, etc.
│   │   ├── challenge/          ChallengeCard
│   │   ├── sandbox/            Editeur Monaco
│   │   ├── profile/            RankBadge, SkillTree, Heatmap
│   │   ├── leaderboard/        Classements
│   │   └── seo/                JsonLd, Analytics
│   │
│   ├── types/                  Definitions TypeScript
│   │   └── index.ts            Types Challenge, User, Submission, etc.
│   │
│   ├── i18n/                   Internationalisation
│   │   ├── index.ts            Classe i18n avec changement de locale
│   │   ├── fr.ts               Traductions francaises
│   │   ├── en.ts               Traductions anglaises
│   │   └── types.ts            Cles typees
│   │
│   └── utils/                  Utilitaires
│       └── jsonld.ts           Generation de schemas JSON-LD
│
├── app.html                    Template HTML racine
├── app.css                     Styles globaux et definitions de themes
├── app.d.ts                    Declarations de types globaux
└── hooks.server.ts             Validation d'authentification server-side

tests/
├── unit/                       Tests unitaires (Vitest)
│   ├── setup.ts
│   ├── api-client.test.ts
│   ├── i18n.test.ts
│   ├── jsonld.test.ts
│   └── toast.test.ts
│
└── e2e/                        Tests end-to-end (Playwright)
    ├── auth.test.ts
    ├── challenges.test.ts
    ├── i18n.test.ts
    └── landing.test.ts
```

### Alias de chemins

Le projet configure les alias suivants dans `svelte.config.js` :

- `$components` -> `src/lib/components`
- `$stores` -> `src/lib/stores`
- `$api` -> `src/lib/api`
- `$types` -> `src/lib/types`

---

## Routing

Le routing est base sur le systeme de fichiers de SvelteKit. Voici les sections principales :

| Route                     | Description                                |
|---------------------------|--------------------------------------------|
| `/`                       | Page d'accueil / Dashboard                 |
| `/auth/*`                 | Authentification (login, register, etc.)   |
| `/challenges`             | Liste et detail des challenges             |
| `/challenges/[id]/sandbox`| Editeur de code (sandbox Monaco)           |
| `/challenges/onboarding`  | Challenges d'integration                   |
| `/community/*`            | Challenges communautaires                  |
| `/enterprise/*`           | Espace entreprise (dashboard, talents)     |
| `/admin/*`                | Administration (challenges, users, audit)  |
| `/developer/*`            | Outils developpeur (cles API, webhooks)    |
| `/profile/[username]`     | Profil public                              |
| `/leaderboards`           | Classements                                |
| `/notifications`          | Centre de notifications                    |
| `/settings`               | Parametres utilisateur                     |

---

## Systeme de themes

L'application propose quatre themes sombres, definis dans `app.css` via des variables CSS :

| Theme      | Description                              |
|------------|------------------------------------------|
| `forge`    | Theme par defaut, tons chauds            |
| `neon`     | Esthetique cyberpunk, accents neon       |
| `arena`    | Ambiance competitive, tons vifs          |
| `terminal` | Style terminal, vert sur fond sombre     |

Le theme actif est gere par le store `theme.svelte.ts` et applique via un attribut `data-theme` sur l'element racine.

---

## Internationalisation

Le projet utilise un systeme i18n maison (pas de bibliotheque tierce). Deux locales sont supportees :

- **fr** (francais) -- locale par defaut
- **en** (anglais)

Les traductions sont stockees dans `src/lib/i18n/fr.ts` et `en.ts` sous forme d'objets plats avec des cles en notation pointee. L'interpolation de parametres est supportee.

Exemple d'utilisation :

```svelte
<script>
  import { t } from '$lib/i18n';
</script>

<p>{t('challenges.title')}</p>
```

---

## Tests

### Tests unitaires

Les tests unitaires utilisent Vitest avec jsdom comme environnement DOM et `@testing-library/svelte` pour le rendu des composants.

```bash
npm run test:unit
npm run test:unit:watch
```

### Tests end-to-end

Les tests E2E utilisent Playwright. Ils lancent automatiquement un build de production et le servent sur le port 4173.

```bash
npm test
```

Configuration Playwright :
- Retries : 0 en local, 2 en CI
- Reporter : `list` en local, `github` en CI

---

## Deploiement

### Docker

Le projet inclut un Dockerfile multi-stage optimise produisant une image d'environ 50 Mo :

```bash
docker build -t skilluv-frontend .
docker run -p 3000:3000 \
  -e API_URL=https://api.skilluv.com \
  -e ORIGIN=https://skilluv.com \
  skilluv-frontend
```

Le conteneur s'execute avec un utilisateur non-root (`skilluv`) et inclut un healthcheck sur `/`.

### Build manuel

```bash
npm run build
node build/index.js
```

L'adaptateur `adapter-node` genere un serveur Node.js autonome dans le dossier `build/`.

---

## Stack technique

| Categorie          | Technologie                          |
|--------------------|--------------------------------------|
| Framework          | SvelteKit 2.55                       |
| UI                 | Svelte 5.54 (runes)                  |
| Langage            | TypeScript 5.9                       |
| CSS                | Tailwind CSS 4.2                     |
| Editeur de code    | Monaco Editor 0.55                   |
| Build              | Vite 8                               |
| Tests unitaires    | Vitest 4.1                           |
| Tests E2E          | Playwright 1.58                      |
| Runtime            | Node.js 22 (Alpine)                  |
| Polices            | Space Grotesk, JetBrains Mono        |

---

## Documentation complementaire

- [Documentation des routes API](docs/API-ROUTES.md) -- description exhaustive de tous les endpoints backend consommes par le frontend.

---

## Licence

Ce projet est distribue sous licence [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les modalites de contribution.
Voir [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) pour les regles de la communaute.

## Securite

Pour signaler une vulnerabilite, voir [SECURITY.md](SECURITY.md).
