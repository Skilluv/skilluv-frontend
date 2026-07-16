# Ce qu'une entreprise peut faire — inventaire complet

> **Addendum MVP frontend — 2026-07-16.** Ce document décrit les routes backend consommées à date. Depuis la livraison de FE-M1 → FE-M11 (voir [CHANGELOG.md](CHANGELOG.md) et [FEATURE-MATRIX.md](FEATURE-MATRIX.md)), le frontend expose en plus :
>
> - **Type d'entreprise (P24)** — wizard 3 cards à `/enterprise/register` (step 3) : `direct_hire`, `staffing_agency`, `remote_international`. Persisté via `PATCH /api/enterprises/me/type-config`.
> - **Agency clients (P24)** — CRUD complet à `/enterprise/agency-clients` (owner-only côté agence). Routes `/api/enterprises/me/agency-clients{,/{id}}`.
> - **Dashboard conditionnel** — le dashboard affiche des cards spécifiques selon `enterprise_type` : lien "Clients agence" pour `staffing_agency`, résumé "Config EOR" pour `remote_international`.
> - **Capabilities recruteur (P18.4)** — un compte enterprise ou recruiter porte automatiquement la capability `enterprise_recruiter`. Les capabilities orthogonales (mentor, community_curator, forum_moderator, etc.) sont accessibles à un compte enterprise si les critères sont remplis — la navbar affiche les liens correspondants via `auth.can(capability)`.
>
> Les routes backend référencées dans ce document restent la source de vérité contractuelle. Les 5 endpoints P24 attendus sont listés dans [BACKEND-GAPS.md](docs/BACKEND-GAPS.md).
>
> ---

Version au **2026-07-07**. Toutes les routes sont préfixées par `/api` côté backend. La colonne "Auth" indique l'exigence :

- **Public** — accessible sans session.
- **Auth** — `AuthUser` (JWT valide, cookie `access_token`).
- **AuthComplete** — `AuthUserComplete` (`AuthUser` + `email_verified` + `profile_completed`).
- **Enterprise owner/recruiter** — `require_enterprise` : rôle `enterprise` ou `recruiter`, email vérifié, **et** TOTP armé ou passkey enrôlée (bypass pour sessions SSO/webauthn). Owner-only marqué en plus.
- **SCIM bearer** — token Bearer entreprise (SCIM 2.0).

Toutes les réponses de succès sont enveloppées :
```json
{ "data": { ... }, "meta": { "request_id": "uuid", "timestamp": "iso8601" } }
```

Erreurs :
```json
{ "error": { "code": "AUTH_...", "message": "...", "start_url": "..." (SSO) }, "meta": { ... } }
```

---

## 1. Onboarding & inscription

### `POST /api/enterprise/register` — Public
Crée un compte owner + une entreprise + une membership `owner active`. Envoie un email de vérification, pose les cookies `access_token`, `refresh_token`, `csrf_token`. Rate-limit **5/heure/IP**.

Body :
```json
{
  "email": "owner@acme.com",
  "username": "acme_owner",
  "password": "Str0ngPass!2026",
  "first_name": "Alice",
  "last_name": "Owner",
  "company_name": "Acme Corp",
  "website": "https://acme.com",
  "industry": "software",
  "company_size": "11-50",
  "country": "FR",
  "terms_accepted": true
}
```

Response :
```json
{
  "data": {
    "user": { /* UserPrivate complet, role: "enterprise" */ },
    "enterprise": { "id": "...", "company_name": "Acme Corp", "slug": "acme-corp", ... },
    "csrf_token": "...",
    "login_method": "password",
    "requires_totp_setup": true,
    "message": "Enterprise account created. Check your email to verify your address, then set up TOTP."
  }
}
```

Politique password : ≥10 chars, majuscule + minuscule + chiffre + symbole. `company_size` ∈ `{1-10, 11-50, 51-200, 201-500, 501-1000, 1000+}`.

---

## 2. Authentification & session

### `POST /api/auth/login` — Public
Body : `{ identifier, password, totp_code?, backup_code?, email_2fa_code? }`.  
Pour les entreprises, la réponse inclut `login_method` et `requires_totp_setup: true` si aucun facteur fort n'est armé.

### `POST /api/auth/webauthn/login/start` puis `/finish` — Public
Login par passkey (Face ID / Touch ID / Windows Hello / YubiKey). Session marquée `login_method: "webauthn"` — bypass automatique du gate 2FA entreprise.

### `POST /api/auth/magic-link/request` puis `/consume` — Public
Login par lien email. Session `login_method: "magic_link"` — ne bypasse **pas** le gate TOTP entreprise (facteur faible).

### `GET /api/enterprise/sso/{slug}/start` puis `/callback` — Public
SSO OIDC B2B (Okta / Azure AD / Google Workspace / Auth0 / Keycloak). Session `login_method: "sso"` — bypass 2FA (l'IdP gère le MFA).

### `POST /api/auth/refresh` — cookie
Rotation des tokens (session + JWT). Préserve `login_method`.

### `POST /api/auth/logout` — Auth
Révoque la session courante.

### `GET /api/auth/me` — Auth
Retourne le user + `login_method` + `has_passkey` + `rank`.

### `POST /api/auth/totp/setup` → `/enable` → `/backup-codes/regenerate` → `/disable` — Auth
Cycle TOTP complet. `/enable` renvoie les backup codes une fois.

### `POST /api/auth/email-2fa/enable` / `/disable` / `/verify` — Auth
Email 2FA (secondaire).

### `POST /api/auth/webauthn/register/start` puis `/finish` — Auth
Enrôlement d'une passkey supplémentaire.

### `GET /api/auth/webauthn/credentials` / `PATCH /{id}` / `DELETE /{id}` — Auth
Liste, renomme, supprime ses passkeys.

### `GET /api/auth/sessions` / `DELETE /{id}` / `POST /revoke-all` — Auth
Liste toutes les sessions actives du user, révocation individuelle ou en masse.

### `POST /api/auth/change-password` / `POST /change-email` / `GET /change-email/confirm` — Auth
Modification password / email avec confirmation.

### `POST /api/auth/account (DELETE)` + `POST /me/data-export` — Auth
Suppression compte RGPD + export archive ZIP (rate limit 1/24h).

---

## 3. Profil entreprise & équipe

### `GET /api/enterprise/profile` — Enterprise
```json
{
  "data": {
    "enterprise": { "id", "owner_id", "company_name", "slug", "description", "website", "logo_url", "industry", "company_size", "country", ... },
    "member_count": 3
  }
}
```

### `PUT /api/enterprise/profile` — Enterprise owner
Body (tout optionnel) :
```json
{
  "company_name": "Acme SA",
  "description": "…",
  "website": "https://acme.com",
  "logo_url": "https://acme.com/logo.png",
  "industry": "software",
  "company_size": "51-200"
}
```

### `POST /api/enterprise/invite` — Enterprise owner
Body : `{ "email": "recruiter@acme.com" }`. Génère un token 7j Redis, envoie un email. Le token est aussi renvoyé pour partage direct (`invite_token`).

### `POST /api/enterprise/invite/accept` — Auth
Body : `{ "token": "abc..." }`. Refuse si l'email de l'user connecté ne matche pas l'email invité. Le user devient `recruiter` de l'enterprise.

### `GET /api/enterprise/members` — Enterprise
Liste tous les membres actifs/pending/revoked avec username, display_name, email, role, status, invited_at, accepted_at.

### `DELETE /api/enterprise/members/{user_id}` — Enterprise owner
Marque `status = revoked` et rétrograde `users.role = user`. Impossible sur soi-même.

---

## 4. Recherche de talents

### `GET /api/talents/search/v2` — Enterprise
13 filtres croisés (l'outil principal de sourcing). Query params :

| Param | Type | Sens |
|---|---|---|
| `q` | string | Recherche textuelle username / display_name / bio |
| `skill_domain` | `code\|design\|game\|security` | Filtre domaine |
| `title` | `apprenti\|artisan\|maitre\|legende` | Niveau de progression |
| `country_iso2` | `FR`, `BJ`, … | Pays ISO-2 |
| `city` | string | Ville |
| `min_fragments` | int | Fragments minimum |
| `min_streak` | int | Streak jours minimum |
| `tag` | string | Tag/compétence |
| `badge` | string | Badge acquis |
| `looking_for` | `job\|freelance\|internship\|any` | Statut recherche |
| `available_only` | bool | Uniquement `profile_active=true` |
| `sort_by` | `relevance\|fragments\|streak\|recent` | Tri |
| `page`, `per_page` | int | Pagination |

Response paginée `{ data: TalentV2[], pagination: { page, per_page, total, total_pages } }`.

`TalentV2` = username, display_name, avatar_url, title, skill_domain, country, city, total_fragments, streak_current, trust_score, badges, is_bookmarked, is_in_list.

---

## 5. Bookmarks & listes de talents

### `POST /api/enterprise/bookmarks/{talent_id}` — Enterprise
Enregistre un talent dans les favoris de l'entreprise.

### `DELETE /api/enterprise/bookmarks/{talent_id}` — Enterprise
Retire du favori.

### `GET /api/enterprise/bookmarks?page=&per_page=` — Enterprise
Liste paginée des talents bookmarkés.

### `POST /api/enterprise/lists` — Enterprise
Body : `{ "name": "Backend Devs Q1", "description": "..." }`. Crée une liste privée à l'entreprise.

### `GET /api/enterprise/lists` — Enterprise
Toutes les listes de l'entreprise.

### `GET /api/enterprise/lists/{list_id}` — Enterprise
Détails + talents inclus.

### `PUT /api/enterprise/lists/{list_id}` — Enterprise
Body : `{ "name"?, "description"? }`.

### `DELETE /api/enterprise/lists/{list_id}` — Enterprise
Supprime la liste (cascade sur les entrées).

### `POST /api/enterprise/lists/{list_id}/talents/{talent_id}` — Enterprise
Ajoute un talent à la liste.

### `DELETE /api/enterprise/lists/{list_id}/talents/{talent_id}` — Enterprise
Retire un talent.

---

## 6. Contact & messagerie (interest → conversation)

Modèle "double opt-in" : l'entreprise envoie un **interest request** avec un message. Le talent accepte ou refuse. Une conversation s'ouvre **uniquement** après acceptation. Un talent peut aussi bloquer une entreprise.

### `POST /api/contact/interest` — Enterprise
Body : `{ "talent_id": "uuid", "message": "..." }` (message 1-2000 chars).  
Rate limit : **5 / heure / entreprise**. Consomme des crédits (1 par requête acceptée). Refuse si le talent a bloqué l'entreprise ou s'il y a un cooldown (30 jours après un decline).

### `GET /api/contact/interest/sent?page=&per_page=` — Enterprise
Historique des requêtes envoyées avec leur `status: pending|accepted|declined`.

### `GET /api/contact/interest/received?page=&per_page=` — Auth (côté talent)
Requêtes reçues.

### `POST /api/contact/interest/{id}/accept` — Auth (talent)
Ouvre la conversation entre entreprise et talent.

### `POST /api/contact/interest/{id}/decline` — Auth (talent)
Déclin + cooldown 30 jours.

### `GET /api/contact/conversations?page=` — Auth
Liste des conversations. Entreprise ↔ talent.

### `GET /api/contact/conversations/{id}` — Auth
Historique complet des messages.

### `POST /api/contact/conversations/{id}/messages` — Auth
Body : `{ "content": "..." }`. Envoi d'un message.

### `POST /api/contact/block/{enterprise_id}` — Auth (talent uniquement)
Bloque une entreprise. Toutes ses futures requêtes vers ce talent sont refusées.

### `DELETE /api/contact/block/{enterprise_id}` — Auth (talent)
Débloque.

---

## 7. Pipeline de recrutement (Kanban)

Kanban interne à l'entreprise : `to_contact → contacted → interviewing → offer → hired → declined`.

### `GET /api/enterprise/pipeline?stage=` — Enterprise
Retourne toutes les entrées (ou celles d'un `stage` donné). Chaque entrée : `id, talent_id, username, display_name, skill_domain, title, total_fragments, stage, position, notes, salary_proposed_eur, last_action_at, created_at, updated_at`.

### `POST /api/enterprise/pipeline` — Enterprise
Body :
```json
{
  "talent_id": "uuid",
  "stage": "to_contact",
  "notes": "Vu au forum X",
  "salary_proposed_eur": 55000
}
```
Idempotent : `ON CONFLICT (enterprise_id, talent_id) DO UPDATE`. Historique tracé dans `enterprise_pipeline_history`.

### `PUT /api/enterprise/pipeline/{id}` — Enterprise
Body : `{ "stage"?, "notes"?, "salary_proposed_eur"?, "position"? }`. Change d'étape, prend des notes, réordonne.

### `DELETE /api/enterprise/pipeline/{id}` — Enterprise
Retire du pipeline.

### `GET /api/enterprise/pipeline/export.csv` — Enterprise
Export CSV complet du pipeline courant.

---

## 8. Crédits & facturation

### `GET /api/enterprise/credits` — Enterprise
```json
{
  "credits": {
    "enterprise_id": "…",
    "balance": 47.5,
    "total_purchased": 100,
    "total_used": 52.5,
    "total_refunded": 0,
    "updated_at": "…"
  }
}
```

### `GET /api/enterprise/credits/transactions?page=&per_page=` — Enterprise
Liste paginée des mouvements : `delta`, `balance_after`, `reason` (`purchase|contact_charge|promo|refund|monthly_reset`), `related_interest_request_id`, `related_payment_id`, `notes`, `expires_at`.

### `POST /api/enterprise/credits/checkout` — Enterprise
Body : `{ "pack_slug": "starter|pro|scale|custom" }`.  
Response : `{ "checkout_url": "https://checkout.stripe.com/..." }`. Redirection Stripe Checkout.

### `POST /api/enterprise/credits/redeem` — Enterprise
Body : `{ "code": "PROMO-XXXX" }`. Applique un code promo.

### `POST /api/enterprise/billing/portal` — Enterprise
Response : `{ "portal_url": "https://billing.stripe.com/..." }`. Redirection Stripe Customer Portal.

### `GET /api/enterprise/invoices?page=&per_page=` — Enterprise
Liste des factures. Chaque : `id, number, amount_eur, currency, status, pdf_url, issued_at`.

### `GET /api/enterprise/invoices/{id}` — Enterprise
Détails d'une facture (lignes détaillées).

### `GET /api/enterprise/invoices/{id}/html` — Enterprise
Version HTML rendue de la facture (imprimable).

### `GET /api/pricing` — Public
Grille tarifaire publique (packs + prix par devise selon FX).

### `POST /api/stripe/webhook` — Signature Stripe
Webhook interne. Crédite le compte à la réception d'un paiement confirmé.

---

## 9. Abonnements (packs mensuels)

### `POST /api/enterprise/subscriptions/subscribe` — Enterprise
Body : `{ "pack_slug": "..." }`. Souscrit à un pack récurrent (crédits mensuels + accès premium).

### `GET /api/enterprise/subscriptions/current` — Enterprise
Retourne l'abonnement actif (ou null) : `pack_slug, status, current_period_end, cancel_at_period_end`.

### `POST /api/enterprise/subscriptions/cancel` — Enterprise owner
Annule à la fin de la période courante (pas de résiliation immédiate).

---

## 10. KYC entreprise

### `GET /api/enterprise/kyc` — Enterprise
Statut KYC : `pending|approved|rejected` + liste des documents fournis.

### `POST /api/enterprise/kyc/documents` — Enterprise owner
Upload multipart d'un document (SIRET / RC / preuve d'adresse / passeport signataire) avec type.

Response : `{ "document_id": "...", "status": "pending" }`.

Deux routes admin en support :
- `GET /api/admin/enterprise-kyc` (liste)
- `POST /api/admin/enterprise-kyc/{enterprise_id}/decide` (approve/reject)

---

## 11. Dashboard entreprise

### `GET /api/enterprise/dashboard/platform-stats` — Enterprise
Stats globales de la plateforme (non spécifiques à l'entreprise) :
```json
{
  "total_talents": 4512,
  "by_domain": { "code": 2010, "design": 1103, "game": 812, "security": 587 },
  "by_title": { "apprenti": 3812, "artisan": 590, "maitre": 92, "legende": 18 },
  "avg_fragments": 122.4,
  "active_last_30d": 1834
}
```

### `GET /api/enterprise/dashboard/my-stats` — Enterprise
Stats propres à l'entreprise :
```json
{
  "bookmarks": 12,
  "talent_lists": 3,
  "interest_requests": { "total": 15, "pending": 4, "accepted": 8, "declined": 3 },
  "active_conversations": 7,
  "team_size": 3
}
```

---

## 12. SSO OIDC B2B

### `POST /api/enterprise/sso/config` — Enterprise owner
Body :
```json
{
  "issuer": "https://tenant.okta.com",
  "client_id": "…",
  "client_secret": "…",
  "email_domains": ["acme.com", "acme.fr"],
  "enforce_sso": false,
  "auto_provision": true,
  "default_role": "recruiter"
}
```
Response : config sans le secret + `redirect_uri` à copier dans l'IdP.

### `GET /api/enterprise/sso/config` — Enterprise owner
Config courante avec `client_secret: "***REDACTED***"`.

### `DELETE /api/enterprise/sso/config` — Enterprise owner
Soft-disable (le `disabled_at` est posé).

### `GET /api/enterprise/sso/discover?email=…` — Public
Utilisé sur la page de login. Retourne `{ sso_available: bool, start_url? }` selon le domaine de l'email.

### `GET /api/enterprise/sso/{slug}/start` — Public
Redirect vers l'IdP. Génère state + nonce + PKCE stockés en Redis.

### `GET /api/enterprise/sso/{slug}/callback?code=&state=` — Public
Callback IdP : exchange code, vérifie ID token (JWKS, iss, aud, exp, nonce, email_verified). JIT provisioning : crée l'user + membership si `auto_provision`. Émet session Skilluv avec `login_method=sso`.

---

## 13. SCIM 2.0 provisioning

### Owner-authenticated
- `POST /api/enterprise/sso/scim/token` — Génère un token bearer (retourné **une seule fois** en clair + hash SHA-256 stocké). Grace period 24h sur l'ancien.
- `DELETE /api/enterprise/sso/scim/token` — Révoque immédiatement.
- `PUT /api/enterprise/sso/scim/groups/{id}/mapped-role` — Body : `{ "mapped_role": "recruiter" | "enterprise" | null }`.

### SCIM bearer (utilisé par l'IdP)
- `GET /api/scim/v2/ServiceProviderConfig` / `/ResourceTypes` / `/Schemas` — Discovery SCIM.
- `GET /api/scim/v2/Users?filter=userName eq "x"&startIndex=&count=` — Liste.
- `POST /api/scim/v2/Users` — Provisionne un user + membership.
- `GET|PUT|PATCH|DELETE /api/scim/v2/Users/{id}` — CRUD.
- `GET /api/scim/v2/Groups`, `POST`, `GET|PUT|PATCH|DELETE /{id}` — CRUD groupes.

PATCH accepte les formats Okta (`path=members[value eq "uuid"]`) et Azure AD (`path=members` + `value=[…]`). PATCH `active: false` révoque la membership + toutes les sessions.

---

## 14. Bounties open-source (côté entreprise)

### `POST /api/bounties` — Enterprise
Sponsorise une issue GitHub. Body :
```json
{
  "github_repo": "acme/api",
  "github_issue_number": 42,
  "amount_eur": 250,
  "skill_domain": "code",
  "description_override": "..."
}
```
Payout automatique au merge de la PR (webhook GitHub).

### `GET /api/bounties?enterprise_id=…` — Public
Liste des bounties actives.

### `GET /api/bounties/{id}` — Public
Détails d'une bounty + PRs en cours.

Reste manipulé par le talent (postuler / lier une PR).

---

## 15. Certifications sponsorisées

### `POST /api/enterprise/certifications/sponsor` — Enterprise
Sponsorise une certification (couvre les frais d'inscription pour un talent invité).

Utilisé plus rarement — voir `/api/certifications` pour la mécanique publique.

---

## 16. Notifications

### `GET /api/notifications?page=&unread_only=` — Auth
Liste paginée. Types entreprise-facing : `interest_accepted`, `interest_declined`, `new_message`, `bounty_solved`, `subscription_renewed`, `credit_low`.

### `POST /api/notifications/{id}/read` — Auth
Marque une notif comme lue.

### `POST /api/notifications/read-all` — Auth
Marque tout comme lu.

---

## 17. Routes qui ont TOUJOURS besoin d'être bloquées pour l'entreprise (isolation)

Le hook `src/hooks.server.ts` redirige automatiquement les rôles `enterprise` et `recruiter` vers `/enterprise/dashboard` s'ils tentent d'accéder à ces routes candidat :

- `/`
- `/challenges/*`
- `/community/*`
- `/forum/*`
- `/guilds/*`
- `/tournaments/*`
- `/feed/*`
- `/leaderboards/*`
- `/bounties` (page publique candidat, l'entreprise a `/enterprise/bounties`)
- `/mentors/*`
- `/mentorship/*`
- `/certifications/*` (page candidat)
- `/diplomas/*`
- `/settings/*` (redirigé vers `/enterprise/settings/*`)
- `/messages` (candidat, l'entreprise a `/enterprise/messages`)

Routes neutres partagées :
- `/auth/*`
- `/legal/*`
- `/notifications`
- `/api/*`

---

## 18. Pages frontend correspondantes (`/enterprise/*`)

| Route | Rôle | Description |
|---|---|---|
| `/enterprise/register` | Public | Inscription 3 steps (owner + entreprise + terms + optionnel passkey step 3). |
| `/enterprise/onboarding` | Owner nouveau | Wizard 5 étapes : bienvenue → 2FA (TOTP OU passkey) → profil → invite → dashboard. |
| `/enterprise/dashboard` | Enterprise | Vue d'ensemble : stats personnelles + globales + accès rapide. |
| `/enterprise/talents` | Enterprise | Recherche talents V2 (13 filtres). |
| `/enterprise/bookmarks` | Enterprise | Liste des talents bookmarkés. |
| `/enterprise/lists` | Enterprise | CRUD listes de talents. |
| `/enterprise/lists/{id}` | Enterprise | Détail d'une liste. |
| `/enterprise/messages` | Enterprise | Inbox des conversations acceptées. |
| `/enterprise/messages/{id}` | Enterprise | Détail conversation. |
| `/enterprise/members` | Enterprise | Membres + invitations. |
| `/enterprise/invite/accept?token=…` | Auth | Landing après clic sur email d'invitation. |
| `/enterprise/profile` | Enterprise | Édition du profil entreprise (description, logo, website…). |
| `/enterprise/credits` | Enterprise | Solde + packs + Stripe Checkout. |
| `/enterprise/credits/success`, `/credits/canceled` | Enterprise | Retour Stripe. |
| `/enterprise/credits/invoices` | Enterprise | Historique factures. |
| `/enterprise/subscriptions` | Enterprise | Souscription pack mensuel. |
| `/enterprise/bounties` | Enterprise | Bounties sponsorisées. |
| `/enterprise/bounties/new` | Enterprise | Créer une bounty. |
| `/enterprise/kyc` | Owner | Upload documents KYC + statut. |
| `/enterprise/settings/sso` | Owner | Config SSO OIDC + SCIM token + group→role mapping. |
| `/enterprise/settings/security` | Enterprise | TOTP, backup codes, passkeys, sessions. |

### Chrome frontend

- **`/enterprise/*` → `EnterpriseHeader`** (logo, notifications, thème, langue, avatar dropdown avec Sécurité + Logout) + **sidebar** (Dashboard, Talents, Bookmarks, Lists, Messages, [Owner: SSO&SCIM]). Aucune Navbar candidat.
- **`/enterprise/register`, `/enterprise/invite/accept`, `/enterprise/onboarding`** — layout "bare" (logo centré uniquement) pendant que l'user est en phase de bootstrap.
- **`/auth/*`** — bare layout (auth).

---

## 19. Contraintes et gates récap

**Pour accéder à n'importe quelle route `/api/enterprise/*` (hors register / invite/accept)** :
1. `AuthUser` valide (JWT).
2. Rôle `enterprise` ou `recruiter`.
3. `email_verified = true` (sauf session SSO).
4. **Un facteur fort armé** : `totp_enabled = true` OU au moins un `webauthn_credentials`. Bypass si `login_method ∈ {sso, webauthn}`.
5. Membership `active` sur au moins une `enterprises`.

**Pour les endpoints "owner-only"** (invite, revoke_member, update_profile, SSO config, KYC upload, cancel subscription) :
- Même contraintes + `enterprise.owner_id == user.id`.

---

## 20. Codes d'erreur spécifiques

| Code | HTTP | Signification | UX recommandée |
|---|---|---|---|
| `AUTH_EMAIL_VERIFY_REQUIRED` | 403 | Email non vérifié | Redirect `/auth/verify-email?next=…` |
| `AUTH_TOTP_SETUP_REQUIRED` | 403 | Pas de 2FA armée sur compte enterprise | Redirect `/enterprise/onboarding` |
| `AUTH_TOTP_REQUIRED` | 403 | Login manque le code TOTP | Afficher champ code |
| `AUTH_SSO_REQUIRED` | 403 | Domaine email force SSO | Redirect `err.start_url` |
| `SCIM_CONFLICT: …` | 400 | POST /Users avec externalId déjà utilisé | Retour à l'IdP |
| `CONTACT_COOLDOWN_ACTIVE` | 429 | Talent a decline < 30 j | Message "réessayer plus tard" |
| `CONTACT_BLOCKED` | 403 | Talent a bloqué l'entreprise | Message "ce talent n'accepte pas de nouvelles requêtes" |
| `INSUFFICIENT_CREDITS` | 400 | Balance < coût de l'action | Redirect `/enterprise/credits` |

---

## Fin de l'inventaire

Toutes les routes listées existent au commit courant. Certaines (bounties enterprise, certifications sponsorisées) ont une couverture de tests plus légère que les autres — vérifier au cas par cas avant de les mettre en prod. Le SCIM v2 est le module le plus récent et le plus testé (10 E2E verts).
