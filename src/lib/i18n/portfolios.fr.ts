import type { PortfolioTranslations } from './portfolios.types';

export const portfoliosFr: PortfolioTranslations = {
	portfolioLabels: {
		downloads: 'téléchargements',
		stars: 'étoiles',
		repositories: 'dépôts',
		packages: 'paquets',
		images: 'images',
		followers: 'abonnés',
		machines: 'machines',
		rooms: 'salles',
		points: 'points',
		reputation: 'réputation',
		articles: 'articles',
		videos: 'vidéos',
		courses: 'cours',
		contributions: 'contributions'
	},

	portableRecord: {
		title: 'Emporte ce parcours',
		subtitle:
			"Tout le parcours public en un fichier, et un badge pour un README. Les deux sont publics, donc celui qui évalue ce profil peut les emporter aussi.",
		jsonCta: 'Ouvrir le JSON',
		badgeAlt: 'Badge de rang Skilluv',
		copyMarkdown: 'Copier le Markdown',
		copied: 'Copié'
	},

	portfolioSettings: {
		title: 'Tes portfolios ailleurs',
		subtitle: 'Les comptes où ton travail existe déjà, liés depuis ton profil.',
		declaredNote:
			"Ces chiffres sont ta parole, et ils le restent. Rien ici n'alimente un rang, un score ou un résultat de recherche — un portfolio déclaré est un contexte, seule une validation Skilluv est une preuve.",
		domainLabel: 'Domaine',
		allDomains: 'Tous',
		empty: 'Aucun portfolio lié pour le moment.',
		emptyHint: 'Ajoute les comptes que tu mettrais sur un CV. Ils apparaissent sur ton profil public.',
		noPlatforms: "Aucune plateforme n'est répertoriée pour ce domaine.",
		addCta: 'Lier un compte',
		formTitle: 'Lier un compte',
		platformLabel: 'Plateforme',
		platformPlaceholder: 'Choisis-en une',
		handleLabel: 'Identifiant',
		handlePlaceholder: 'ton-pseudo',
		urlLabel: 'URL du profil',
		urlHint:
			"Pré-remplie depuis ton identifiant quand la plateforme annonce la forme de ses URL. Corrige-la si elle est fausse.",
		itemsLabel: 'Nombre',
		reachLabel: 'Portée',
		figuresOptional: 'Les deux chiffres sont facultatifs. Laisse-les vides plutôt que de les deviner.',
		saveCta: 'Lier',
		cancelCta: 'Annuler',
		removeCta: 'Retirer',
		removeConfirm: 'Retirer ce portfolio de ton profil ?',
		added: 'Portfolio lié.',
		removed: 'Portfolio retiré.',
		declaredBadge: 'Déclaré',
		verifiedBadge: 'Confirmé',
		openProfile: 'Ouvrir le profil'
	}
};
