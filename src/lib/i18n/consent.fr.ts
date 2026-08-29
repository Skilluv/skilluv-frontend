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

export const consentFr = {
	consent: {
		banner: {
			aria: 'Bannière de consentement aux cookies et traceurs',
			title: 'Cookies et traceurs',
			body: 'Nous utilisons des cookies et traceurs essentiels au fonctionnement du site. Avec ton accord, nous pouvons aussi mesurer l\'audience (analytique) et te proposer des contenus marketing. Tu peux changer d\'avis à tout moment.',
			privacyLink: 'En savoir plus',
			acceptAll: 'Tout accepter',
			rejectAll: 'Tout refuser',
			customize: 'Personnaliser'
		},
		modal: {
			title: 'Mes préférences de traceurs',
			intro: 'Choisis catégorie par catégorie. Les traceurs essentiels sont nécessaires au site et ne peuvent pas être désactivés. Les autres sont désactivés par défaut.',
			storedOn: 'Choix enregistré le {date} (version {version}). Tu peux le modifier ci-dessous.',
			alwaysOn: 'Toujours actif',
			saveChoices: 'Enregistrer mes choix',
			revokeHint: 'Tu peux retirer ou modifier ton consentement à tout moment via le lien « Gérer mes préférences » en bas de page.',
			essential: {
				label: 'Traceurs essentiels',
				hint: 'Session, authentification, protection anti-fraude. Requis pour utiliser Skilluv.'
			},
			analytics: {
				label: 'Mesure d\'audience',
				hint: 'PostHog (hébergement UE) pour comprendre comment le site est utilisé et l\'améliorer. Pas de revente à des tiers.'
			},
			marketing: {
				label: 'Marketing',
				hint: 'Contenus et communications personnalisés (newsletters ciblées, remarketing). Aucun traceur publicitaire tiers sans ton accord.'
			}
		},
		footer: {
			managePreferences: 'Gérer mes préférences'
		}
	}
};
