/**
 * The enlistment — the four screens between arriving and having an account,
 * plus the first act that follows.
 *
 * Kept in its own namespace rather than under `auth.register` because it is no
 * longer a form with a domain picker in front of it: it is a sequence with its
 * own vocabulary (domain, trade, pact, first act), and that vocabulary should
 * be readable in one file by whoever translates it.
 *
 * Class names and one-line descriptions are *not* here. They live in
 * `disciplines.{domain}.label` / `.desc`, shared with the public pages, so a
 * discipline reads the same the day somebody picks it as the day they read
 * about it.
 */
export interface EnlistTranslations {
	enlist: {
		/** Screen 1 — ready, or already one of us. */
		ready: {
			title: string;
			titleAccent: string;
			lead: string;
			cta: string;
			haveAccount: string;
			loginLink: string;
		};
		/** Screen 2 — the wall of the eleven domains. */
		fresco: {
			eyebrow: string;
			/** `{n}` of `{total}`, shown as a counter in the corner. */
			counter: string;
			/** `{n} trades` — hidden entirely when the catalogue did not answer. */
			trades: string;
			choose: string;
			previous: string;
			next: string;
			hint: string;
			back: string;
		};
		/** Screen 3 — the trades of the chosen domain. */
		path: {
			eyebrow: string;
			title: string;
			subtitle: string;
			/** `{max}` — the cap the backend enforces. */
			cap: string;
			capReached: string;
			chosen: string;
			primary: string;
			primaryHint: string;
			modeLearning: string;
			modeActive: string;
			remove: string;
			mustPickOne: string;
			continue: string;
			empty: string;
			loadError: string;
			changeDomain: string;
			searchLabel: string;
			searchPlaceholder: string;
			searchClear: string;
			matches: string;
			noMatch: string;
			noMatchHint: string;
			railPrevious: string;
			railNext: string;
		};
		/** Screen 4 — the pact. The form, and nothing but. */
		account: {
			eyebrow: string;
			title: string;
			lead: string;
			domainLabel: string;
			tradesLabel: string;
			changeDomain: string;
			changeTrades: string;
			username: string;
			usernamePlaceholder: string;
			email: string;
			emailPlaceholder: string;
			firstName: string;
			lastName: string;
			password: string;
			passwordHint: string;
			country: string;
			city: string;
			cityHint: string;
			terms: string;
			termsLink: string;
			privacyLink: string;
			submit: string;
			submitting: string;
			ssoDivider: string;
			ssoHint: string;
			/** Shown when the account exists but a trade could not be registered. */
			partialTrades: string;
		};
		/** Validation, worded as the person reads it — never as the API says it. */
		errors: {
			username: string;
			email: string;
			firstName: string;
			lastName: string;
			password: string;
			country: string;
			terms: string;
			noDomain: string;
		};
		/** The first act, one per domain. `label` names it, `lead` says what it asks. */
		rite: {
			title: string;
			subtitle: string;
			start: string;
			pending: string;
			fork: { label: string; lead: string };
			upload: { label: string; lead: string };
			playtest: { label: string; lead: string };
			disclosure: { label: string; lead: string };
			proposal: { label: string; lead: string };
			defect: { label: string; lead: string };
			workspace: { label: string; lead: string };
			render: { label: string; lead: string };
			translation: { label: string; lead: string };
			explainer: { label: string; lead: string };
			retro: { label: string; lead: string };
			/** Shown when the backend has no first act for this domain yet. */
			notReadyTitle: string;
			notReadyBody: string;
			notReadyCta: string;
		};
	};
}
