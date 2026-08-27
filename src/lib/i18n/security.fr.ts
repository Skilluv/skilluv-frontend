import type { SecurityTranslations } from './security.types';

export const securityFr: SecurityTranslations = {
	securityScope: {
		title: 'Signaler une vulnérabilité',
		subtitle: 'Ce qui est dans le périmètre, ce qui n’y est pas, et ce qu’on promet en retour.',
		inScopeTitle: 'Dans le périmètre',
		outOfScopeTitle: 'Hors périmètre',
		contactLabel: 'Contact',
		policyCta: 'Lire la politique complète',
		slaLabel: 'Trié sous {n} jours',
		embargoLabel: 'Embargo par défaut : {n} jours',
		safeHarbourTitle: 'Safe harbour',
		safeHarbourBody:
			'Teste ce qui est listé ci-dessus, dans les limites de débit publiées, et on ne viendra pas te chercher. Sors-en et cette protection ne te suit pas.',
		reportCta: 'Signaler quelque chose',
		researchModeTitle: 'Mode recherche',
		researchModeBody:
			'Un jeton multiplie ta limite de débit par {n} et ne donne rien d’autre. Ce n’est pas une autorisation de tester ce qui n’est pas listé ci-dessus.',
		researchModeCta: 'Obtenir un jeton',
		rewardsTitle: 'Ce que vaut un finding confirmé',
		rewardsHint:
			'Lu depuis la plateforme, pas écrit ici : la table bouge, et un chiffre périmé est une promesse rompue.',
		fragmentsFor: '{n} fragments',
		orientationsTitle: 'Les cinq branches',
		reviewerGroup: 'Relu par {group}'
	},

	securityReport: {
		title: 'Signaler une vulnérabilité',
		subtitle: 'Écrit pour que quelqu’un qui ne l’a jamais vue puisse la reproduire.',
		fieldTitle: 'Titre',
		fieldDescription: 'De quoi il s’agit',
		fieldDescriptionHint: 'Le défaut, dans tes mots. Ce qui casse, et pourquoi c’est important.',
		fieldRepro: 'Comment la reproduire',
		fieldReproHint:
			'Étape par étape, depuis un état propre. Un rapport que personne ne peut suivre est un rapport que personne ne peut confirmer.',
		fieldImpact: 'Ce que ça permet de faire',
		fieldFix: 'Comment tu la corrigerais',
		fieldTargetKind: 'Ce que ça touche',
		fieldTargetHost: 'Hôte',
		fieldEndpoint: 'Endpoint affecté',
		fieldSeverity: 'À quel point c’est grave, selon toi',
		fieldSeverityHint: 'Ton évaluation. Le triage peut trancher autrement, et les deux sont gardées.',
		fieldCvss: 'Vecteur CVSS',
		fieldCwe: 'CWE',
		anonymousLabel: 'Signaler sans mon nom',
		anonymousHint:
			'Tu restes crédité en privé. Seul le hall of fame affiche un alias à la place.',
		proofsTitle: 'Preuves',
		proofsHint:
			'Captures d’écran, un enregistrement, une courte vidéo. Téléversées d’abord, parce que tu les prends pendant que tu as encore l’exploit sous les yeux.',
		proofAdd: 'Ajouter une preuve',
		proofStored: 'Enregistrée.',
		proofFailed: 'Ce fichier a été refusé.',
		proofNotALink:
			'La preuve d’une vulnérabilité non corrigée n’a pas d’adresse stable. Ce sont des clés, pas des liens.',
		submitCta: 'Envoyer le rapport',
		submittedTitle: 'Reçu',
		submittedBody: 'Tu auras une réponse d’ici le {date}. C’est ce que promet la politique.',
		rateLimited: 'Cinq rapports par heure. Prends un moment — rien n’est perdu.',
		targetKinds: {
			platform: 'La plateforme elle-même',
			mission: 'Une mission',
			project: 'Un projet',
			other: 'Autre chose'
		}
	},

	securityMyReports: {
		title: 'Ce que tu as signalé',
		subtitle: 'Où en est chacun, et ce qui t’attend.',
		empty: 'Tu n’as rien signalé.',
		emptyHint: 'Lis d’abord le périmètre, puis signale ce que tu trouves.',
		reportedAs: 'Tu l’as évaluée {tier}',
		triageDue: 'Réponse attendue le {date}',
		embargoUntil: 'Sous embargo jusqu’au {date}',
		openRoundTitle: 'Un relecteur a demandé quelque chose',
		answerPlaceholder: 'Ta réponse.',
		answerCta: 'Répondre',
		answeredToast: 'Envoyé.',
		withdrawCta: 'Retirer',
		withdrawnToast: 'Retiré.',
		tooLateToWithdraw: 'Celui-là a déjà été traité. Il ne peut plus être dé-signalé.',
		writeupCta: 'Lire le writeup',
		statuses: {
			submitted: 'En attente de triage',
			triaged: 'Trié',
			confirmed: 'Confirmé',
			duplicate: 'Doublon',
			not_applicable: 'Non applicable',
			withdrawn: 'Retiré',
			fixed: 'Corrigé',
			published: 'Publié'
		},
		statusHints: {
			duplicate:
				'Quelqu’un l’a trouvée avant. C’était quand même du travail, et ça compte comme tel.',
			not_applicable: 'Jugée non défectueuse. Le raisonnement est sur le rapport.'
		},
		severities: {
			critical: 'Critique',
			high: 'Élevée',
			medium: 'Moyenne',
			low: 'Faible',
			informational: 'Informative'
		},
		stages: {
			embargoed: 'Sous embargo',
			extension_requested: 'Extension demandée',
			partially_disclosed: 'Partiellement divulguée',
			public: 'Publique',
			withheld: 'Retenue'
		}
	},

	securityFinding: {
		title: 'Finding',
		embargoedTitle: 'Pas encore publié',
		embargoedBody:
			'Ce dont il s’agit reste retenu jusqu’à correction et divulgation. Ce que tu peux voir, c’est que quelqu’un a trouvé quelque chose de cette gravité, dans cette classe de faiblesse, à cette date — c’est exactement ce que l’attestation affirme.',
		reportedBy: 'Signalé par',
		anonymousReporter: 'Signalé anonymement',
		confirmedOn: 'Confirmé le {date}',
		publishedOn: 'Publié le {date}',
		cvssLabel: 'CVSS',
		cweLabel: 'Classe de faiblesse',
		writeupCta: 'Lire le writeup',
		notFound: 'Aucun finding ne porte cet identifiant.'
	},

	securityHallOfFame: {
		title: 'Hall of fame',
		subtitle: 'Ceux qui nous ont prévenus avant que quelqu’un d’autre ne le découvre.',
		contributorsTitle: 'Contributeurs',
		recentTitle: 'Publiés récemment',
		empty: 'Personne pour l’instant.',
		emptyHint:
			'Chaque finding confirmé met un nom ici, sauf si celui qui l’a signalé a demandé autrement.',
		findingCount: '{n} findings',
		topSeverity: 'Plus haute : {tier}',
		since: 'Depuis le {date}',
		anonymous: 'A choisi de ne pas être nommé',
		statConfirmed: 'confirmés',
		statPublished: 'publiés',
		statFixed: 'corrigés',
		statReporters: 'rapporteurs',
		statMedianDays: 'jours médians jusqu’à publication'
	},

	securityTrust: {
		title: 'Trust center',
		subtitle: 'Ce qu’on fait en matière de sécurité, et ce qu’on n’a pas encore fait.',
		documentsTitle: 'Documents',
		complianceTitle: 'Conformité',
		complianceHonesty:
			'Dit tel quel. Une auto-évaluation n’est pas un audit, et rien ici ne prétend l’être.',
		contactsTitle: 'Contacts',
		programmeTitle: 'Programme de divulgation',
		safeHarbour: 'Safe harbour pour la recherche de bonne foi',
		noSafeHarbour: 'Aucun safe harbour déclaré',
		scopeTitle: 'Dans le périmètre',
		sameNumbersNote:
			'Ces chiffres viennent des mêmes lignes que le hall of fame. Deux pages ne peuvent pas citer des nombres différents.',
		states: {
			self_assessed: 'Auto-évalué',
			not_started: 'Pas commencé',
			in_progress: 'En cours',
			certified: 'Certifié'
		}
	},

	securityPractice: {
		ctfTitle: 'Capture the flag',
		ctfSubtitle: 'Des cibles qu’on héberge, des flags qu’on a plantés, et qui est arrivé le premier.',
		scoreboardTitle: 'Classement',
		scoreboardEmpty: 'Personne n’a encore résolu quoi que ce soit.',
		solves: '{n} résolus',
		firstSolves: '{n} en premier',
		lastSolve: 'Dernier le {date}',
		flagTitle: 'Soumettre un flag',
		flagPlaceholder: 'skilluv{…}',
		flagCta: 'Soumettre',
		flagCorrect: 'Correct.',
		flagWrong: 'Pas celui-là.',
		flagFirstBlood: 'Première résolution. Personne ne l’avait avant toi.',
		attemptsLeft: '{n} tentatives restantes cette heure',
		fragmentsAwarded: '{n} fragments',
		attestationIssued: 'Une attestation a été émise.',
		labTitle: 'Répondre au lab',
		labSubmitCta: 'Soumettre les réponses',
		labScore: '{correct} sur {total} — {percent} %',
		labPassed: 'Réussi.',
		labFailed: 'Pas cette fois.',
		labWrongQuestions: 'Faux : {ids}',
		labAttemptsLeft: '{n} tentatives restantes',
		listingUnavailable:
			'La plateforme ne dit pas encore quels challenges sont des cibles et lesquels sont des labs : impossible de les lister séparément ici.'
	},

	securityResearch: {
		title: 'Mode recherche',
		subtitle: 'Un jeton qui augmente ta limite de débit. Rien d’autre.',
		noToken: 'Aucun jeton émis.',
		issueCta: 'Émettre un jeton',
		labelField: 'Libellé',
		daysField: 'Jours',
		issuedTitle: 'Ton jeton',
		issuedOnce:
			'Affiché une seule fois. Copie-le maintenant — un rechargement le perd, et en émettre un autre remplace celui-ci.',
		copyCta: 'Copier',
		copiedToast: 'Copié.',
		headerLabel: 'À envoyer dans',
		grantsNothing:
			'Il augmente une limite de débit et ne donne rien. Ce n’est pas une autorisation de tester hors périmètre, et il ne te protégera pas là-bas.',
		prefixLabel: 'Préfixe',
		issuedAt: 'Émis le {date}',
		expiresAt: 'Expire le {date}',
		lastUsed: 'Dernier usage le {date}',
		neverUsed: 'Jamais utilisé',
		requestsSeen: '{n} requêtes',
		revokeCta: 'Révoquer',
		revokedToast: 'Révoqué.',
		multiplier: '{n}× la limite normale'
	},

	securityBounties: {
		title: 'Programmes de bug bounty',
		subtitle: 'Des programmes publics qui valent une soirée. On n’en gère aucun.',
		empty: 'Rien de curaté pour l’instant.',
		filterPlatform: 'Plateforme',
		filterAll: 'Toutes',
		paidOnly: 'Rémunérés seulement',
		openProgramme: 'Ouvrir',
		claimsTitle: 'Ce que tu as revendiqué',
		claimsEmpty: 'Tu n’as rien revendiqué d’ailleurs.',
		claimCta: 'Revendiquer un travail fait ailleurs',
		claimPlatform: 'Plateforme',
		claimOrganisation: 'Organisation',
		claimReportUrl: 'Lien vers le rapport',
		claimReportUrlHint:
			'Public, pour qu’un relecteur puisse l’ouvrir. Ta parole n’est pas la vérification.',
		claimSeverity: 'Gravité qui t’a été attribuée',
		claimCwe: 'CWE',
		claimSummary: 'De quoi il s’agissait',
		claimDisclosedOn: 'Divulgué le',
		claimSubmit: 'Revendiquer',
		claimedToast: 'Déposé. Un relecteur ouvrira le lien.',
		claimStates: {
			waiting: 'En attente de relecture',
			confirmed: 'Confirmé',
			refused: 'Refusé'
		},
		refusedReason: 'Pourquoi : {reason}'
	},

	securityCredentials: {
		title: 'Certifications',
		subtitle: 'Ce que tu détiens, et ce que quelqu’un a vérifié.',
		verifiedTitle: 'Vérifiées',
		declaredTitle: 'Déclarées',
		declaredHint:
			'Ta parole tant qu’un relecteur n’a pas ouvert la page de l’émetteur. Affiché comme tel, parce que c’est toi que ça concerne.',
		empty: 'Rien d’enregistré.',
		addTitle: 'Enregistrer une certification',
		fieldIssuer: 'Émetteur',
		fieldName: 'Nom',
		fieldLevel: 'Niveau',
		fieldCredentialId: 'Numéro de certification',
		fieldEvidence: 'Lien public',
		fieldEvidenceHint: 'Obligatoire : une certification que personne ne peut ouvrir est une phrase.',
		fieldIssuedOn: 'Obtenue le',
		fieldExpiresOn: 'Expire le',
		addCta: 'Enregistrer',
		addedToast: 'Enregistrée, en attente de vérification.',
		lapsed: 'Périmée',
		verifiedOn: 'Vérifiée le {date}',
		openEvidence: 'Ouvrir'
	}
};
