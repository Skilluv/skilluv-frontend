/**
 * Translation keys for the cookie and tracker consent surface.
 *
 * Folded into `Translations` the same way the design and security namespaces
 * are, so `i18n.t('consent.banner.acceptAll')` type-checks like any other key
 * while the legal wording stays readable as one file.
 */
export interface ConsentTranslations {
	consent: {
		/** The non-blocking banner shown until a decision is recorded. */
		banner: {
			aria: string;
			title: string;
			body: string;
			privacyLink: string;
			acceptAll: string;
			rejectAll: string;
			customize: string;
		};
		/** Per-category preferences, reachable from the banner and the footer. */
		modal: {
			title: string;
			intro: string;
			/** Takes `{date}` and `{version}` — what was agreed, and to which text. */
			storedOn: string;
			alwaysOn: string;
			saveChoices: string;
			revokeHint: string;
			essential: { label: string; hint: string };
			analytics: { label: string; hint: string };
			marketing: { label: string; hint: string };
		};
		footer: {
			managePreferences: string;
		};
	};
}
