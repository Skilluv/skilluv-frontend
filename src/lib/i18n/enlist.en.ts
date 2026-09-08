import type { EnlistTranslations } from './enlist.types';

export const enlistEn: EnlistTranslations = {
	enlist: {
		ready: {
			title: 'Pick your path',
			titleAccent: 'and prove it',
			lead: 'Eleven domains, hundreds of trades, one first act. Everything you make here is yours, and it checks out.',
			cta: "I'm ready",
			haveAccount: 'Already have an account?',
			loginLink: 'Sign in'
		},
		fresco: {
			eyebrow: 'Your domain',
			counter: '{n} / {total}',
			trades: '{n} trades',
			choose: 'Take this path',
			previous: 'Previous domain',
			next: 'Next domain',
			hint: 'Arrows or swipe to browse',
			back: 'Back to the entrance'
		},
		path: {
			eyebrow: 'Your trade',
			title: 'The trade you want to prove',
			subtitle: 'Up to {max}. The first one is your main path; the others stay open.',
			cap: 'Up to {max} trades',
			capReached: 'You already have {max}. Remove one to pick another.',
			chosen: 'Your selection',
			primary: 'Main',
			primaryHint: 'What your profile leads with.',
			modeNote: 'Learning or practising: that is what your profile will say. You can change it whenever you like.',
			modeLabel: '{name}: learning or practising',
			remove: 'Remove {name}',
			mustPickOne: 'Pick at least one trade to continue.',
			continue: 'Continue',
			empty: 'No trade is open in this domain yet.',
			loadError: 'The catalogue did not answer. Try again in a moment.',
			changeDomain: 'Change domain',
			searchLabel: 'Search a trade',
			searchPlaceholder: 'Search: front, data, sound…',
			searchClear: 'Clear search',
			matches: '{n} of {total}',
			noMatch: 'No trade matches “{q}”.',
			noMatchHint: 'Try another word, or clear the search to see all {total} again.',
			railPrevious: 'Previous trades',
			railNext: 'Next trades'
		},
		account: {
			eyebrow: 'The pact',
			title: 'What is left to sign',
			lead: 'The minimum for what you make to carry your name.',
			domainLabel: 'Domain',
			tradesLabel: 'Trades',
			changeDomain: 'Change',
			changeTrades: 'Edit',
			username: 'Username',
			usernamePlaceholder: 'kofi_dev',
			email: 'Email',
			emailPlaceholder: 'kofi@example.com',
			firstName: 'First name',
			lastName: 'Last name',
			password: 'Password',
			country: 'Country',
			city: 'City',
			cityHint: 'Optional',
			terms: 'I accept the',
			termsLink: 'Terms of Service',
			privacyLink: 'Privacy Policy',
			submit: 'Enter',
			submitting: 'Creating your account...',
			ssoDivider: 'or faster',
			ssoHint: 'Your domain and trades are kept.',
			partialTrades:
				'Your account is created. One trade could not be registered — you can add it from your profile.'
		},
		errors: {
			username: 'Pick a username.',
			email: 'Enter an email address.',
			firstName: 'Enter your first name.',
			lastName: 'Enter your last name.',
			country: 'Select a country.',
			terms: 'You must accept the Terms of Service and the Privacy Policy.',
			noDomain: 'Pick a domain first.'
		},
		rite: {
			title: 'Your first act',
			subtitle: 'A real artefact, today. It is what opens your record.',
			start: 'Begin',
			status: {
				forked: 'Starter forked onto your account',
				hello_committed: 'HELLO.md committed',
				pr_opened: 'Pull request open, awaiting review',
				completed: 'Rite passed',
				abandoned: 'Rite abandoned'
			},
			openFork: 'Open my fork',
			openPr: 'See pull request #{n}',
			reviewNote: 'We see your pull request the moment it opens. A reviewer settles it after that: the rite passes then, not before.',
			needsTrade: 'Pick a trade first: the starter we fork for you is chosen from it.',
			needsTradeCta: 'Pick my trade',
			needsGithub: 'This rite happens on GitHub. Link your account so we can fork the starter there.',
			needsGithubCta: 'Link my GitHub account',
			pending: 'Under review',
			notReadyTitle: 'This first act is not open yet',
			notReadyBody:
				'Your domain is registered and your account is active. The entry rite for this path opens soon — the full catalogue is already yours in the meantime.',
			notReadyCta: 'Browse the challenges'
		}
	}
};
