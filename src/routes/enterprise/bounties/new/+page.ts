import { redirect } from '@sveltejs/kit';

// La page de création dédiée a été remplacée par une modale sur
// /enterprise/bounties. Toute URL existante (dashboard, navbar,
// campagnes marketing, bookmarks, etc.) atterrit ici et est redirigée
// vers la page bounties avec `?new=1` pour ouvrir la modale
// automatiquement.
export function load() {
	throw redirect(302, '/enterprise/bounties?new=1');
}
