import type { DesignWorkflowTranslations } from './design_workflow.types';

export const designWorkflowFr: DesignWorkflowTranslations = {
	designWorkshop: {
		trailTitle: 'Le fil des critiques',
		trailEmpty: 'Aucun tour pour l’instant. La première version ouvre le fil.',
		trailPublicNote:
			'Public volontairement : comment une pièce est arrivée là en dit plus que la pièce.',
		roundLabel: 'Tour {n}',
		decisions: {
			approve: 'Validé',
			iterate: 'Un tour de plus',
			reject: 'Refusé',
			pending: 'En attente de critique'
		},
		blockingReason: 'Ce qui bloquait',
		authorNotes: 'Ce que l’auteur a changé',
		reviewerFeedback: 'La critique',
		openArtifact: 'Ouvrir cette version',
		gridTitle: 'Grille',
		compareTitle: 'Comparer deux tours',
		compareFrom: 'Du tour',
		compareTo: 'Au tour',
		compareCta: 'Comparer',
		compareStrategy: 'Ce qui mérite d’être comparé ici',
		compareStrategyUnknown: 'Aucune piste de comparaison pour ce type de livrable.',
		compareBetween: 'Ce qui a été dit entre les deux',
		compareSameRound: 'Choisis deux tours différents, le plus ancien en premier.',
		checksTitle: 'Vérifications automatiques',
		checksEmpty: 'Rien n’a été vérifié automatiquement sur cette pièce.',
		checksNotAVerdict:
			'Rien de tout ceci n’est un verdict. Une version peut porter une erreur et être validée quand même : aucune vérification ne sait si un signe est juste pour une coopérative.',
		severities: {
			info: 'Note',
			warning: 'À regarder',
			error: 'En échec'
		},
		submitTitle: 'Rendre une version',
		submitArtifactUrl: 'Où vit cette version',
		submitArtifactUrlHint:
			'Un nœud Figma versionné, un board hébergé, un projet publié, ou un fichier que tu as téléversé.',
		submitByLink: 'Coller un lien',
		submitByFile: 'Téléverser un fichier',
		submitFileReady: 'Fichier stocké. Ajoute tes notes et rends la version.',
		submitNotes: 'Ce qui a changé',
		submitNotesHint:
			'Facultatif sur la première version, et la chose la plus utile à écrire sur toutes les suivantes.',
		submitCta: 'Demander une critique',
		submitToast: 'Rendu. En attente d’une critique.',
		roundsUsed: '{used} tours sur les {expected} annoncés',
		roundsCeiling: 'Le plafond est de cinq tours.',
		queueTitle: 'Ce qui t’attend',
		queueSubtitle: 'Les versions dans les métiers que tu peux juger, les plus anciennes d’abord.',
		queueEmpty: 'Rien en attente.',
		queueEmptyHint:
			'Soit la file est vide, soit tu n’as pas encore de droit de review. Les deux se ressemblent ici.',
		reviewCta: 'Ouvrir'
	},

	designUpload: {
		title: 'Téléverser un livrable',
		subtypeLabel: 'Quel type de livrable',
		pickFile: 'Choisir un fichier',
		ceiling: 'Jusqu’à {size} pour ce type.',
		tooLarge: 'Ce fichier dépasse le plafond de ce type. Rien n’a été envoyé.',
		previewRequired:
			'Un navigateur ne sait pas ouvrir ce type de fichier : il doit arriver avec une image qui le représente. La tienne sera meilleure que n’importe quelle image automatique.',
		previewPick: 'Choisir l’aperçu',
		previewDone: 'Aperçu enregistré.',
		uploading: 'Envoi en cours',
		progress: 'Partie {done} sur {total}',
		done: 'Envoyé.',
		failed: 'L’envoi a échoué.',
		etagMisconfigured:
			'Le stockage a accepté le fichier mais ne l’a pas confirmé d’une façon lisible par le navigateur. C’est un réglage du bucket, pas ton fichier.',
		cancel: 'Arrêter',
		resume: 'Reprendre',
		downloadCta: 'Obtenir un lien',
		subtypes: {
			brand_kit: 'Kit de marque',
			icon_set: 'Jeu d’icônes',
			type_family: 'Famille typographique',
			copy_deck: 'Copy deck',
			research_document: 'Document de recherche',
			interface: 'Interface',
			design_system: 'Design system',
			illustration_set: 'Série d’illustrations',
			sound: 'Son',
			motion: 'Motion',
			video: 'Vidéo',
			three_d_scene: 'Scène 3D'
		}
	},

	designTools: {
		title: 'Outils de design',
		subtitle: 'Connecte les outils où vit ton travail, et vérifie un lien avant de le rendre.',
		connectionsTitle: 'Connectés',
		connectionsEmpty: 'Rien de connecté.',
		connectedSince: 'Connecté le {date}',
		expiresAt: 'Expire le {date}',
		connectCta: 'Connecter',
		disconnectCta: 'Déconnecter',
		disconnectedToast: 'Déconnecté.',
		unavailableTitle: 'Indisponible sur ce déploiement',
		unavailableBody:
			'Skilluv n’a pas encore de compte développeur chez cet outil, la connexion ne peut donc pas se faire. Ton compte n’a rien.',
		inspectTitle: 'Vérifier un lien',
		inspectSubtitle:
			'Un relecteur qui ne peut pas ouvrir ton travail ne peut pas le valider. Colle le lien avant de rendre, pas après.',
		inspectPlaceholder: 'https://…',
		inspectCta: 'Vérifier',
		inspectRecognised: 'Reconnu comme {provider}.',
		inspectUnknown: 'Ce n’est pas un lien d’outil de design connu.',
		inspectOpensFreely: 'S’ouvre sans compte.',
		inspectNeedsAccount: 'Demande un partage activé.',
		inspectTooLong: 'Ce lien est trop long pour être vérifié.',
		warnUnrecognisedLink:
			'Ce lien ne pointe vers aucun outil de design connu. Vérifie que c’est bien l’adresse du livrable.',
		warnNeedsPublicSharing:
			'Un lien {provider} n’est visible que si le fichier est partagé publiquement. Vérifie le partage avant de rendre : un relecteur qui ne peut pas ouvrir ton travail ne peut pas le valider.',
		providers: {
			figma: 'Figma',
			miro: 'Miro',
			webflow: 'Webflow'
		}
	},

	designBriefs: {
		title: 'Briefs',
		subtitle: 'La plupart des challenges design viennent des briefs curatés. Propose le tien.',
		proposeTitle: 'Proposer un brief',
		fieldTitle: 'Titre',
		fieldBrief: 'Le brief',
		fieldBriefHint:
			'Ce qui est demandé, pour qui, et ce qui ferait une bonne réponse. Un brief vague produit un travail vague.',
		fieldOrientation: 'Orientation',
		fieldSubtype: 'Livrable',
		fieldDifficulty: 'Difficulté',
		fieldHours: 'Heures estimées',
		fieldRounds: 'Tours annoncés',
		fieldRoundsHint: 'Ce à quoi un designer doit s’attendre. Le plafond est de cinq.',
		fieldFormat: 'Format',
		formats: {
			individual: 'Challenge individuel',
			contest: 'Concours'
		},
		submitCta: 'Proposer',
		submittedToast: 'Proposé. Un admin le relit avant qu’il ouvre.',
		mineTitle: 'Ce que tu as proposé',
		mineEmpty: 'Tu n’as pas encore proposé de brief.',
		notAChallengeYet:
			'Pas encore ouvert : rien ne peut être réservé tant qu’un admin ne l’a pas publié.',
		withdrawCta: 'Retirer',
		withdrawnToast: 'Retiré.',
		rejectedFeedback: 'Pourquoi il a été refusé',
		openPublished: 'Ouvrir le challenge',
		statuses: {
			pending: 'En attente de relecture',
			published: 'Publié',
			rejected: 'Refusé',
			withdrawn: 'Retiré'
		}
	},

	nextChallenges: {
		title: 'À quoi passer ta semaine',
		subtitle: 'Challenges et concours, classés ensemble : ils répondent à la même question.',
		empty: 'Rien à suggérer pour l’instant.',
		emptyHint: 'Finis ton onboarding et quelques briefs, et ça se remplit.',
		cachedNote:
			'Gardé une heure volontairement : une liste qui change à chaque rechargement cesse d’être un conseil.',
		refresh: 'Rafraîchir',
		whyTitle: 'Pourquoi celui-ci',
		scoreLabel: 'Score',
		closesAt: 'Ferme le {date}',
		hours: '{n} h',
		difficulty: 'Difficulté {n}',
		formats: {
			individual: 'Solo',
			contest: 'Concours'
		},
		openCta: 'Ouvrir'
	},

	missionWork: {
		title: 'Espace de mission',
		subtitle: 'L’accord, les tours, les notes et l’argent, au même endroit.',
		ndaTitle: 'Accord',
		ndaUnreviewed: 'Ce modèle n’est pas passé chez un juriste. Lis-le pour ce qu’il est.',
		ndaSignedOn: 'Signé le {date}',
		ndaTypedName: 'Écris ton nom complet',
		ndaTypedNameHint: 'C’est ta signature.',
		ndaSignCta: 'Signer',
		ndaSignedToast: 'Signé.',
		ndaChangedError:
			'L’accord a changé depuis qu’il t’a été montré. Lis le nouveau avant de signer.',
		ndaReleased: 'Tu en as été libéré le {date}.',
		roundsTitle: 'Tours',
		roundsEmpty: 'Rien n’a encore été rendu.',
		roundsNormal:
			'Deux ou trois tours, c’est normal en design, pas un échec. La mission reste en cours tant qu’un tour n’est pas accepté.',
		roundLabel: 'Tour {n}',
		beyondAgreed: 'Au-delà des tours annoncés par le brief',
		deliverTitle: 'Rendre un tour',
		deliverUrl: 'Où ça vit',
		deliverNotes: 'Ce qui a changé',
		deliverCta: 'Rendre',
		deliveredToast: 'Rendu.',
		acceptCta: 'Accepter',
		acceptedToast: 'Accepté. La mission est livrée.',
		requestChangesCta: 'Demander des changements',
		requestChangesReason: 'Ce qui ne va pas',
		requestChangesHint:
			'Vingt caractères minimum : « pas tout à fait » coûte un tour et n’apprend rien.',
		requestedToast: 'Changements demandés.',
		awaitingDecision: 'En attente de décision',
		decisions: {
			accepted: 'Accepté',
			changes_requested: 'Changements demandés'
		},
		ratingsTitle: 'Notes',
		ratingsBlind:
			'Rien n’est lisible tant que les deux côtés n’ont pas écrit, ou que quatorze jours ne sont pas passés.',
		rateCta: 'Noter',
		rateValue: 'Sur cinq',
		rateComment: 'Quelque chose à ajouter',
		ratedToast: 'Enregistré, et masqué tant que l’autre côté n’a pas écrit.',
		standingLabel: '{average} sur {count} notes',
		standingNone: 'Aucune note révélée pour l’instant.',
		invoicesTitle: 'Factures',
		invoicesEmpty: 'Rien de facturé pour l’instant.',
		invoiceAmount: 'Montant',
		invoiceCommission: 'Commission',
		payCta: 'Payer',
		applicationsTitle: 'Candidatures',
		applicationsEmpty: 'Personne n’a encore candidaté.',
		verifiedAttestations: '{n} vérifiés sur Skilluv',
		declaredLinks: 'Liens déclarés',
		acceptApplicant: 'Accepter',
		rejectApplicant: 'Refuser',
		rejectReason: 'Pourquoi',
		decidedToast: 'Décision enregistrée.'
	},

	designPlagiarism: {
		flagCta: 'Signaler une copie',
		flagTitle: 'Signaler cette proposition',
		flagIntro:
			'L’auteur est prévenu, en entier, et reçoit un délai pour répondre avant toute décision.',
		flagReason: 'Ce qui a été copié',
		flagReasonHint: 'Assez précis pour que quelqu’un qui n’a vu ni l’un ni l’autre puisse vérifier.',
		flagEvidence: 'Lien vers l’original',
		flagEvidenceHint:
			'Obligatoire : une accusation sans rien à regarder est une accusation invérifiable.',
		flagSubmit: 'Signaler',
		flaggedToast: 'Signalé. L’auteur a été prévenu.',
		alreadyOpen: 'Un dossier est déjà ouvert sur cette proposition.',
		caseTitle: 'Dossier de plagiat',
		caseNotYours: 'Seuls l’auteur et les relecteurs peuvent lire ce dossier.',
		accusedLabel: 'Proposition de',
		raisedByLabel: 'Signalé par',
		raisedAt: 'Ouvert le {date}',
		respondBy: 'Réponds avant le {date}',
		windowClosed: 'Le délai de réponse est passé.',
		respondTitle: 'Ta réponse',
		respondHint: 'Elle est lue avant toute décision.',
		respondCta: 'Répondre',
		respondedToast: 'Réponse enregistrée.',
		decisionTitle: 'Décision',
		priorCases: '{n} dossiers déjà retenus contre ce compte',
		statuses: {
			open: 'En attente de réponse',
			answered: 'Répondu',
			upheld: 'Retenu',
			dismissed: 'Classé'
		}
	},

	designPractice: {
		title: 'Outils et terrains',
		subtitle: 'Avec quoi les designers travaillent, et où il vaut la peine de contribuer.',
		toolkitTitle: 'Outils',
		toolkitEmpty: 'Rien de curaté pour ce domaine pour l’instant.',
		accessLabel: 'Ce que ça coûte d’y accéder',
		openTool: 'Ouvrir',
		allOrientations: 'Toutes les orientations',
		filterCategory: 'Catégorie',
		filterAll: 'Tout',
		terrainsTitle: 'Où contribuer',
		terrainsSubtitle:
			'Des projets amont que quelqu’un a étudiés comme de bons points de départ. Une proposition devient un terrain quand un steward la reprend.',
		terrainsEmpty: 'Rien de proposé pour ce domaine pour l’instant.',
		whyTitle: 'Pourquoi celui-ci',
		adopted: 'Adopté',
		adoptedOn: 'Adopté le {date}',
		notAdopted: 'Présélectionné',
		notAdoptedHint: 'Personne ne le steward encore, donc rien n’en est ingéré.',
		openUpstream: 'Ouvrir le projet amont',
		openProject: 'Ouvrir sur Skilluv',
		declinedReason: 'Refusé : {reason}'
	},

	featuredTalent: {
		title: 'Designer de la semaine',
		subtitle: 'Mis en avant par un éditeur, avec la raison attachée.',
		empty: 'Personne mis en avant cette semaine.',
		weekOf: 'Semaine du {date}',
		whyTitle: 'Pourquoi',
		seeProfile: 'Voir le profil',
		historyTitle: 'Précédemment',
		noPostingNote:
			'Rien n’est publié nulle part depuis ici. Celui qui partage est une personne, pas un planificateur.'
	},

	designAwards: {
		title: 'Design Awards',
		subtitle: 'Une année de travail, mise en avant par ceux qui l’ont vue.',
		editionOf: 'Édition {year}',
		noEdition: 'Aucune édition pour {year}.',
		noEditionHint: 'Une édition ouvre quand l’année qu’elle couvre est terminée.',
		statuses: {
			draft: 'Pas encore ouverte',
			nominations: 'Nominations ouvertes',
			voting: 'Vote ouvert',
			concluded: 'Résultats publiés'
		},
		weights: '{community} % communauté, {jury} % jury',
		prizePerCategory: '{amount} par catégorie',
		nominationsClose: 'Nominations closes le {date}',
		votingCloses: 'Vote clos le {date}',
		categoriesTitle: 'Catégories',
		categoryEmpty: 'Rien de proposé ici pour l’instant.',
		nomineesTitle: 'Nominés',
		citationLabel: 'Ce qui est plaidé',
		shortlisted: 'Sur le bulletin',
		notShortlisted: 'Pas sur le bulletin',
		communityVotes: '{n} communauté',
		juryVotes: '{n} jury',
		weightedScore: 'Pondéré {n}',
		voteCta: 'Voter',
		voteJuryCta: 'Vote jury',
		votedToast: 'Vote enregistré.',
		nominateTitle: 'Proposer un travail',
		nominateCategory: 'Catégorie',
		nominateSubject: 'Ce que tu proposes',
		nominateSubjectHint:
			'L’identifiant de la personne, du projet ou du livrable que la catégorie demande.',
		nominateCitation: 'Pourquoi ça le mérite',
		nominateCitationHint:
			'Obligatoire, et c’est toute la nomination : on ne peut pas peser un nom.',
		nominateCta: 'Proposer',
		nominatedToast: 'Proposé.',
		closedNote: 'Plus rien ne bouge sur cette édition.',
		previousEditions: 'Autres années'
	},

	designSeries: {
		title: 'Éditions et sprints',
		subtitle:
			'Des concours qui vont ensemble. Une édition d’awards, c’est plusieurs jugés en parallèle ; un sprint, c’est un concours court, relancé.',
		runningTitle: 'En cours',
		pastTitle: 'Autres éditions',
		empty: 'Rien de groupé pour l’instant.',
		emptyHint:
			'Une édition ouvre quand l’année qu’elle couvre est finie ; un sprint tient sur son week-end.',
		openCta: 'Lire',
		backCta: 'Toutes les éditions',
		everyDomain: 'Ouvert à tous les domaines',
		notFound: 'Aucune édition ne porte ce nom.',
		noStandings: 'Rien n’a encore été jugé.',
		noPodium: 'Pas encore de podium sur celui-ci.',
		kinds: {
			awards_edition: 'Édition d’awards',
			sprint: 'Sprint',
			programme: 'Programme'
		}
	},

	mentorMatches: {
		title: 'Qui pourrait t’aider',
		subtitle: 'Des mentors de ton domaine, et ce que tu as en commun avec chacun.',
		wouldHelp:
			'Tu as rendu plusieurs pièces sans qu’aucune n’aboutisse encore. C’est un endroit normal où être, et c’est précisément là qu’un mentor sert le plus.',
		empty: 'Personne à suggérer pour l’instant.',
		emptyHint:
			'Le matching se fait sur la famille, les outils et le fuseau. Renseigne-les et ça se remplit.',
		whyTitle: 'Pourquoi cette personne',
		craftScore: 'Craft {n}',
		activeMentees: '{n} mentorés',
		timezoneGap: '{n} h d’écart',
		openCta: 'Voir le mentor'
	},

	designIterationStories: {
		title: 'Le travail qui s’est discuté',
		subtitle:
			'Trois tours ou plus. Une critique et une correction, ça arrive à tout le monde ; trois, c’est là où une direction a été remise en cause et où quelqu’un est revenu.',
		empty: 'Rien ici pour l’instant.',
		roundsTaken: '{n} tours',
		firstVersion: 'Première version',
		finalVersion: 'Où ça a atterri',
		validatedOn: 'Validé le {date}'
	}
};
