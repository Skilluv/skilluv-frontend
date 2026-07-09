# Skilluv Frontend

> **Where the African OSS generation shows what they can build.**

> 🇬🇧 English (this page) · 🇫🇷 [Version française](README.fr.md)

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-ff3e00.svg)](https://kit.svelte.dev/)
[![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00.svg)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

---

## What is Skilluv?

Skilluv is a community platform training talents in **code, design, security, and game development** through real contributions to real open source projects. Every completed challenge produces a verifiable artifact that lives on the contributor's public portfolio and is exportable to recruiters.

**Talents never pay for access.** Companies do, because they benefit when African contributors become excellent.

Learn more in the [backend repository](https://github.com/jeremie0342/skilluv-backend) which hosts the full product vision.

## What this repo contains

This is the **web application** used by talents (and companies) to interact with Skilluv. Built with **SvelteKit 2, Svelte 5, Tailwind CSS 4, TypeScript, and Vite**.

It covers a large surface of the product already:

- **Talent journey** — onboarding, profile, portfolio, challenge discovery and submission, sandbox editor (Monaco), certifications, diplomas, mentorship, opportunities board, real-time leaderboards
- **Community surfaces** — feed, forum, guilds, direct messages, notifications, mentor listings, tournaments, bounties
- **Enterprise surfaces** — dedicated landing (`for-companies`), pricing, subscription management, talent search, sponsored challenges
- **Public and legal surfaces** — landing pages, developer/API section, legal pages
- **Theming and i18n** — dark/light modes, French/English bundled

## Companion repositories

- [`skilluv-backend`](https://github.com/jeremie0342/skilluv-backend) — Rust + Axum API (auth, data, business logic)
- [`skilluv-admin`](https://github.com/jeremie0342/skilluv-admin) — SvelteKit admin panel for platform operators
- [`skilluv-ia`](https://github.com/jeremie0342/skilluv-ia) — Python AI microservice

## Quick start

**Prerequisites**: Node.js 22+, npm 10+, and a running Skilluv backend on port 3001.

```bash
git clone https://github.com/jeremie0342/skilluv-frontend.git
cd skilluv-frontend
npm install
cp .env.example .env
# edit .env to point PUBLIC_API_URL at your backend

npm run dev
```

The app opens on `http://localhost:5173`.

Detailed instructions (routing, themes, i18n, testing, deployment) are in [`README.fr.md`](README.fr.md) — English translation in progress.

## Stack summary

| Layer              | Technology                        |
|--------------------|-----------------------------------|
| Framework          | SvelteKit 2.30                    |
| UI runtime         | Svelte 5.54 (runes)               |
| Language           | TypeScript 5.9                    |
| CSS                | Tailwind CSS 4.2                  |
| Code editor        | Monaco Editor 0.55                |
| Build              | Vite 8                            |
| Unit tests         | Vitest 4.1                        |
| E2E tests          | Playwright 1.58                   |
| Runtime            | Node.js 22 (Alpine)               |
| Typography         | Space Grotesk, JetBrains Mono     |

## Contributing

We welcome contributors — Svelte devs, designers, UX writers, translators, accessibility experts, community builders. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community rules.

**AI-assisted contributions are welcome.** Please disclose the assistance level in your pull request description.

## Security

For security disclosures, see [SECURITY.md](SECURITY.md). Do not open public issues for vulnerabilities.

## Community

Community channels are being set up. Follow the maintainer on GitHub for launch announcements.

## License

Distributed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

## Origin

Skilluv is built solo by [Jeremie Zitti](https://github.com/jeremie0342), a Beninese engineer. Public launch: **January 2027**. Private beta: **autumn 2026**.
