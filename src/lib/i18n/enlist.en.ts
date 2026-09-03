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
			modeLearning: 'Learning',
			modeActive: 'Practising',
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
			passwordHint: 'At least 10 characters, with uppercase, lowercase, digit and symbol',
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
			password: 'At least 10 characters, with uppercase, lowercase, digit and symbol.',
			country: 'Select a country.',
			terms: 'You must accept the Terms of Service and the Privacy Policy.',
			noDomain: 'Pick a domain first.'
		},
		rite: {
			title: 'Your first act',
			subtitle: 'A real artefact, today. It is what opens your record.',
			start: 'Begin',
			pending: 'Under review',
			fork: {
				label: 'The first commit',
				lead: 'We fork a starter onto your account. You write your HELLO.md and open the pull request.'
			},
			upload: {
				label: 'The first screen',
				lead: 'A short brief, one screen handed in. The critique answers in three verdicts.'
			},
			playtest: {
				label: 'The first playtest',
				lead: "You play a slice somebody handed in, and return a verdict you can back up."
			},
			disclosure: {
				label: 'The first finding',
				lead: 'You read the public scope, then report one finding on our practice ground.'
			},
			proposal: {
				label: 'The first proposal',
				lead: "You read a service objective from Skilluv's own infrastructure and propose one improvement."
			},
			defect: {
				label: 'The first report',
				lead: 'You file one reproducible defect on our ground, with everything needed to replay it.'
			},
			workspace: {
				label: 'The first step',
				lead: 'An entry mission, one workspace step, your reasoning made readable.'
			},
			render: {
				label: 'The first twenty seconds',
				lead: 'A twenty-second signature, sources declared.'
			},
			translation: {
				label: 'The first paragraph',
				lead: 'You translate one paragraph of a guide. A reviewer from the domain answers.'
			},
			explainer: {
				label: 'The first explanation',
				lead: 'You explain one skill in three beats, for somebody starting out.'
			},
			retro: {
				label: 'The first retrospective',
				lead: "A public Skilluv incident, your reading of what happened and what we keep from it."
			},
			notReadyTitle: 'This first act is not open yet',
			notReadyBody:
				'Your domain is registered and your account is active. The entry rite for this path opens soon — the full catalogue is already yours in the meantime.',
			notReadyCta: 'Browse the challenges'
		}
	}
};
