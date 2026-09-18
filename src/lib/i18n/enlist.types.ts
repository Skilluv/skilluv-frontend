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
			/**
			 * What the learning/practising switch actually does.
			 *
			 * The switch itself is labelled from `orientations.modeChoice`, which
			 * is where the field's vocabulary lives; this only explains it. It
			 * says the two things somebody pressing it cannot otherwise know: the
			 * answer is published on their profile, and it is not final.
			 */
			modeNote: string;
			/** `{name}` — the trade the switch belongs to, for assistive tech. */
			modeLabel: string;
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
			country: string;
			terms: string;
			noDomain: string;
		};
		/**
		 * The first act.
		 *
		 * The per-domain descriptions that used to live here are gone: the
		 * endpoint serves the title, description and instructions per domain and
		 * in the reader's language, and the frozen pair had already drifted from
		 * it. What remains is the frame around them.
		 */
		rite: {
			title: string;
			subtitle: string;
			start: string;
			pending: string;
			status: {
				forked: string;
				hello_committed: string;
				/** A submission rite: open and waiting on a person. */
				pr_opened: string;
				/** The same status on a fork rite, which waits on nobody. */
				pr_opened_checked: string;
				completed: string;
				abandoned: string;
			};
			openFork: string;
			/** `{n}` — the pull request number. */
			openPr: string;
			/**
			 * What the screen promises while it waits, and the two forms do not
			 * wait for the same thing.
			 *
			 * A fork rite is settled by five mechanical checks on the pull
			 * request webhook — no reviewer, no capability, no queue — so it
			 * says the verdict lands on the spot. The eleven submission rites
			 * are settled by a person, and `reviewNote` says so.
			 *
			 * `forkHandedToReviewer` is the third case, and it is not a
			 * transient one: the checks run inside the webhook handler, so an
			 * open pull request they have not touched means the automatic
			 * decision did not happen and a person has it. It says that, in the
			 * fork's own terms, because there is a pull request rather than a
			 * hand-in.
			 */
			autoCheckNote: string;
			forkHandedToReviewer: string;
			reviewNote: string;
			/**
			 * A refused check, which is not a failed rite.
			 *
			 * The reason itself comes from the API written to be read as it
			 * stands, so there is no key for it here. These two frame it: what
			 * it is, and that another commit on the same pull request replays
			 * the checks.
			 */
			refusedTitle: string;
			refusedFix: string;
			needsTrade: string;
			needsTradeCta: string;
			needsGithub: string;
			needsGithubCta: string;
			notReadyTitle: string;
			notReadyBody: string;
			notReadyCta: string;
			/**
			 * The two states this step used to sit silent in.
			 *
			 * `loading` started true and was cleared only by the fetch the page
			 * makes when it has a discipline to fetch for. With no session, or a
			 * session declaring none, it waited on a request it had decided not to
			 * make — skeletons for ever, on a step whose navbar is removed.
			 */
			needsSessionTitle: string;
			needsSessionBody: string;
			needsSessionCta: string;
			needsDomainTitle: string;
			needsDomainBody: string;
			needsDomainCta: string;
		};
	};
}
