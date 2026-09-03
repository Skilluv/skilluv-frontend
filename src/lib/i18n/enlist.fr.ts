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
			modeLearning: 'J’apprends',
			modeActive: 'Je pratique',
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
			emailPlaceholder: 'kofi@exemple.com',
			firstName: 'Prénom',
			lastName: 'Nom',
			password: 'Mot de passe',
			passwordHint: '10 caractères minimum, avec majuscule, minuscule, chiffre et symbole',
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
			password: 'Au moins 10 caractères, avec majuscule, minuscule, chiffre et symbole.',
			country: 'Sélectionne un pays.',
			terms: 'Tu dois accepter les CGU et la politique de confidentialité.',
			noDomain: 'Choisis d’abord un domaine.'
		},
		rite: {
			title: 'Ton premier geste',
			subtitle: 'Un artefact réel, dès aujourd’hui. C’est ce qui ouvre ton historique.',
			start: 'Commencer',
			pending: 'En cours de relecture',
			fork: {
				label: 'Le premier commit',
				lead: 'On fork un starter sur ton compte. Tu écris ton HELLO.md, tu ouvres la pull request.'
			},
			upload: {
				label: 'Le premier écran',
				lead: 'Un brief court, un écran rendu. La critique te répond en trois verdicts.'
			},
			playtest: {
				label: 'Le premier playtest',
				lead: 'Tu joues une tranche déposée par quelqu’un, tu rends ton verdict argumenté.'
			},
			disclosure: {
				label: 'Le premier constat',
				lead: 'Tu lis le périmètre public, tu remontes un constat sur notre terrain d’exercice.'
			},
			proposal: {
				label: 'La première proposition',
				lead: 'Tu lis un objectif de service de l’infrastructure Skilluv, tu proposes une amélioration.'
			},
			defect: {
				label: 'Le premier rapport',
				lead: 'Tu déposes un défaut reproductible sur notre terrain, avec ce qu’il faut pour le rejouer.'
			},
			workspace: {
				label: 'La première étape',
				lead: 'Une mission d’entrée, une étape d’atelier, ton raisonnement rendu lisible.'
			},
			render: {
				label: 'Les vingt premières secondes',
				lead: 'Une signature sonore de vingt secondes, sources déclarées.'
			},
			translation: {
				label: 'Le premier paragraphe',
				lead: 'Tu traduis un paragraphe de guide. Un relecteur du domaine te répond.'
			},
			explainer: {
				label: 'La première explication',
				lead: 'Tu expliques une compétence en trois temps, pour quelqu’un qui débute.'
			},
			retro: {
				label: 'La première rétro',
				lead: 'Un incident public de Skilluv, ta lecture de ce qui s’est passé et de ce qu’on en garde.'
			},
			notReadyTitle: 'Ce premier geste n’est pas encore ouvert',
			notReadyBody:
				'Ton domaine est enregistré et ton compte est actif. Le rite d’entrée de cette voie ouvre bientôt — en attendant, le catalogue complet t’est déjà accessible.',
			notReadyCta: 'Voir les challenges'
		}
	}
};
