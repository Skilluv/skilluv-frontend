/**
 * Feature flags Skilluv — piloter via env vars publiques.
 *
 * Chaque flag est resolu au build (Vite substitue `import.meta.env.PUBLIC_*`
 * a la compilation). Pour changer un flag en prod : mettre a jour la var d'env
 * sur Coolify puis redeployer. Pas de flag "runtime" pour l'instant — la
 * simplicite de la substitution build-time l'emporte sur l'agilite d'un
 * feature-flag service tiers pour la Phase A0.
 *
 * Convention : `on` par defaut (opt-out), sauf mention contraire.
 */

/**
 * Route family P26 v2 (workflow challenge externe : slices, validations,
 * candidatures validateur, verify attestation, digest maintainers).
 *
 * OFF par defaut : les endpoints backend correspondants ne sont pas encore
 * tous deployes en staging (SKI-72..91, SKI-115..123 en Todo). Une fois le
 * back livre, mettre `PUBLIC_P26_ENABLED=true` sur Coolify.
 *
 * Impact quand OFF :
 *  - les liens navigation vers `/dashboard/slices`, `/validations/*`,
 *    `/settings/validator-*`, `/for-maintainers` sont caches
 *  - les routes elles-memes restent accessibles en URL directe (soft-launch :
 *    on peut partager le lien d'un beta-tester sans exposer publiquement)
 */
export const P26_ENABLED = import.meta.env.PUBLIC_P26_ENABLED === 'true';
