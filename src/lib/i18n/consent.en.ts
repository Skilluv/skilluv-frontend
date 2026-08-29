/**
 * Cookie and tracker consent strings.
 *
 * Its own namespace file, like design/security/portfolios, rather than another
 * block inside the 2000-line locale: the wording here is the legal surface a
 * regulator reads, and it is easier to review as one file.
 *
 * Do not soften the labels, and do not demote "reject". It carries the same
 * visual weight as "accept" in the banner on purpose -- a refusal that is
 * harder to click than an acceptance is not freely given consent.
 */

export const consentEn = {
	consent: {
		banner: {
			aria: 'Cookie and tracker consent banner',
			title: 'Cookies and trackers',
			body: 'We use cookies and trackers that are essential to run the site. With your consent, we may also measure audience (analytics) and send you marketing content. You can change your mind at any time.',
			privacyLink: 'Learn more',
			acceptAll: 'Accept all',
			rejectAll: 'Reject all',
			customize: 'Customize'
		},
		modal: {
			title: 'My tracker preferences',
			intro: 'Choose category by category. Essential trackers are required to run the site and cannot be disabled. The others are off by default.',
			storedOn: 'Choice stored on {date} (version {version}). You can update it below.',
			alwaysOn: 'Always on',
			saveChoices: 'Save my choices',
			revokeHint: 'You can withdraw or update your consent at any time via the "Manage my preferences" link in the footer.',
			essential: {
				label: 'Essential trackers',
				hint: 'Session, authentication, anti-fraud. Required to use Skilluv.'
			},
			analytics: {
				label: 'Audience measurement',
				hint: 'PostHog (EU-hosted) to understand how the site is used and improve it. No resale to third parties.'
			},
			marketing: {
				label: 'Marketing',
				hint: 'Personalized content and communications (targeted newsletters, remarketing). No third-party ad trackers without your consent.'
			}
		},
		footer: {
			managePreferences: 'Manage my preferences'
		}
	}
};
