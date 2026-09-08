import type { EnlistTranslations } from './enlist.types';

export const enlistFr: EnlistTranslations = {
	enlist: {
		ready: {
			title: 'Choisis ta voie',
			titleAccent: 'et prouve-la',
			lead: 'Onze domaines, des centaines de métiers, un seul premier geste. Tout ce que tu fabriques ici t’appartient et se vérifie.',
			cta: 'Je suis prêt',
			haveAccount: 'Tu as déjà un compte ?',
			loginLink: 'Se connecter'
		},
		fresco: {
			eyebrow: 'Ton domaine',
			counter: '{n} / {total}',
			trades: '{n} métiers',
			choose: 'Choisir cette voie',
			previous: 'Domaine précédent',
			next: 'Domaine suivant',
			hint: 'Flèches ou glissement pour parcourir',
			back: 'Revenir à l’entrée'
		},
		path: {
			eyebrow: 'Ton métier',
			title: 'Le métier que tu veux prouver',
			subtitle: 'Jusqu’à {max}. Le premier est ta voie principale, les autres restent ouverts.',
			cap: 'Jusqu’à {max} métiers',
			capReached: 'Tu en as déjà {max}. Retire-en un pour en choisir un autre.',
			chosen: 'Ta sélection',
			primary: 'Principal',
			primaryHint: 'Ce que ton profil annonce en premier.',
			modeNote: 'Apprentissage ou pratique : c’est ce que ton profil annoncera. Tu peux en changer quand tu veux.',
			modeLabel: '{name} : apprentissage ou pratique',
			remove: 'Retirer {name}',
			mustPickOne: 'Choisis au moins un métier pour continuer.',
			continue: 'Continuer',
			empty: 'Aucun métier ouvert dans ce domaine pour l’instant.',
			loadError: 'Le catalogue n’a pas répondu. Réessaie dans un instant.',
			changeDomain: 'Changer de domaine',
			searchLabel: 'Chercher un métier',
			searchPlaceholder: 'Chercher : front, données, son…',
			searchClear: 'Effacer la recherche',
			matches: '{n} sur {total}',
			noMatch: 'Aucun métier ne correspond à « {q} ».',
			noMatchHint: 'Essaie un autre mot, ou efface la recherche pour revoir les {total}.',
			railPrevious: 'Métiers précédents',
			railNext: 'Métiers suivants'
		},
		account: {
			eyebrow: 'Le pacte',
			title: 'Ce qu’il reste à signer',
			lead: 'Le minimum pour que ce que tu fabriques porte ton nom.',
			domainLabel: 'Domaine',
			tradesLabel: 'Métiers',
			changeDomain: 'Changer',
			changeTrades: 'Modifier',
			username: 'Pseudo',
			usernamePlaceholder: 'kofi_dev',
			email: 'Email',
			emailPlaceholder: 'kofi@example.com',
			firstName: 'Prénom',
			lastName: 'Nom',
			password: 'Mot de passe',
			country: 'Pays',
			city: 'Ville',
			cityHint: 'Optionnel',
			terms: 'J’accepte les',
			termsLink: 'CGU',
			privacyLink: 'politique de confidentialité',
			submit: 'Entrer',
			submitting: 'Création du compte...',
			ssoDivider: 'ou plus vite',
			ssoHint: 'Ton domaine et tes métiers sont gardés.',
			partialTrades:
				'Ton compte est créé. Un métier n’a pas pu être enregistré — tu pourras l’ajouter depuis ton profil.'
		},
		errors: {
			username: 'Choisis un pseudo.',
			email: 'Indique une adresse email.',
			firstName: 'Indique ton prénom.',
			lastName: 'Indique ton nom.',
			country: 'Sélectionne un pays.',
			terms: 'Tu dois accepter les CGU et la politique de confidentialité.',
			noDomain: 'Choisis d’abord un domaine.'
		},
		rite: {
			title: 'Ton premier geste',
			subtitle: 'Un artefact réel, dès aujourd’hui. C’est ce qui ouvre ton historique.',
			start: 'Commencer',
			status: {
				forked: 'Starter forké sur ton compte',
				hello_committed: 'HELLO.md commité',
				pr_opened: 'Pull request ouverte, en attente de relecture',
				completed: 'Rite validé',
				abandoned: 'Rite abandonné'
			},
			openFork: 'Ouvrir mon fork',
			openPr: 'Voir la pull request #{n}',
			reviewNote: 'On voit ta pull request dès qu’elle est ouverte. Un relecteur tranche ensuite : le rite passe en validé à ce moment-là, pas avant.',
			needsTrade: 'Choisis d’abord un métier : le starter qu’on te forke est choisi à partir de lui.',
			needsTradeCta: 'Choisir mon métier',
			needsGithub: 'Ce rite se joue sur GitHub. Lie ton compte pour qu’on puisse y forker le starter.',
			needsGithubCta: 'Lier mon compte GitHub',
			pending: 'En cours de relecture',
			notReadyTitle: 'Ce premier geste n’est pas encore ouvert',
			notReadyBody:
				'Ton domaine est enregistré et ton compte est actif. Le rite d’entrée de cette voie ouvre bientôt — en attendant, le catalogue complet t’est déjà accessible.',
			notReadyCta: 'Voir les challenges'
		}
	}
};
