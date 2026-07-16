import type { Translations } from './types';

export const fr: Translations = {
	common: {
		actions: {
			save: 'Sauvegarder', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier',
			search: 'Rechercher', retry: 'Réessayer', back: 'Retour', next: 'Suivant',
			previous: 'Précédent', submit: 'Soumettre', confirm: 'Confirmer', close: 'Fermer',
			create: 'Créer', loading: 'Chargement...', sending: 'Envoi...'
		},
		nav: {
			home: 'Accueil', challenges: 'Challenges', leaderboards: 'Classements',
			profile: 'Profil', settings: 'Paramètres', notifications: 'Notifications',
			login: 'Connexion', register: 'Commencer', logout: 'Déconnexion', community: 'Communauté'
		},
		domains: { code: 'Code', design: 'Design', game: 'Jeux Vidéo', security: 'Cybersécurité' },
		titles: { apprenti: 'Apprenti', ranger: 'Ranger', artisan: 'Artisan', maitre: 'Maître', doyen: 'Doyen', legende: 'Légende' },
		difficulty: { 1: 'Débutant', 2: 'Facile', 3: 'Intermédiaire', 4: 'Avancé', 5: 'Expert' },
		tone: { serious: 'Sérieux', fun: 'Loufoque', educational: 'Éducatif' },
		time: { minutes: '{n} min', hours: '{n}h', noLimit: 'Libre', ago: 'il y a' },
		fragments: 'fragments', streak: 'Streak', team: 'Équipe', votes: 'votes', page: 'Page'
	},
	landing: {
		title: 'Prouve ce que tu sais faire.',
		titleAccent: 'Pour de vrai.',
		subtitle: 'Skilluv est la plateforme où les talents tech prouvent leurs compétences à travers des challenges concrets. Zéro CV. Zéro déclaratif. Que des preuves.',
		cta: 'Commencer gratuitement',
		ctaSecondary: 'Voir les challenges',
		statDomains: 'Domaines',
		statLanguages: 'Langages',
		statFree: 'Gratuit'
	},
	dashboard: {
		greeting: 'Salut, {name}',
		cardChallenges: 'Challenges',
		cardChallengesDesc: 'Explore et complète des challenges pour gagner des fragments.',
		cardProfile: 'Mon Profil',
		cardProfileDesc: 'Ton profil vivant, généré par tes preuves.',
		cardLeaderboards: 'Classements',
		cardLeaderboardsDesc: 'Top 100 en temps réel par domaine et par pays.'
	},
	auth: {
		register: {
			pickDomain: 'Qu\'est-ce qui te passionne ?',
			pickDomainSub: 'Choisis ton domaine principal. Tu pourras explorer les autres après.',
			codeDesc: 'Développement web, mobile, backend, algorithmique...',
			designDesc: 'UI/UX, graphisme, illustration, motion design...',
			gameDesc: 'Game design, développement, 3D, narration...',
			securityDesc: 'Pentesting, CTF, forensics, cryptographie...',
			changeDomain: '← Changer de domaine',
			createAccount: 'Crée ton compte',
			domain: 'Domaine',
			username: 'Nom d\'utilisateur',
			email: 'Email',
			firstName: 'Prénom',
			lastName: 'Nom',
			password: 'Mot de passe',
			passwordHint: '8 caractères minimum',
			creating: 'Création...',
			createBtn: 'Créer mon compte',
			hasAccount: 'Déjà un compte ?',
			loginLink: 'Connexion'
		},
		login: {
			title: 'Content de te revoir',
			subtitle: 'Connecte-toi pour continuer ton parcours.',
			identifier: 'Email ou nom d\'utilisateur',
			password: 'Mot de passe',
			forgotPassword: 'Mot de passe oublié ?',
			totpLabel: 'Code TOTP (Google Authenticator)',
			email2faMessage: 'Un code a été envoyé à ton adresse email.',
			email2faLabel: 'Code de vérification',
			loggingIn: 'Connexion...',
			loginBtn: 'Se connecter',
			noAccount: 'Pas encore de compte ?',
			registerLink: 'Créer un compte'
		},
		forgot: {
			title: 'Mot de passe oublié',
			subtitle: 'Entre ton email, on t\'envoie un lien de réinitialisation.',
			sendLink: 'Envoyer le lien',
			sending: 'Envoi...',
			sentTitle: 'Email envoyé',
			sentMessage: 'Si un compte existe avec cet email, tu recevras un lien de réinitialisation.',
			backToLogin: 'Retour à la connexion'
		},
		reset: {
			title: 'Nouveau mot de passe',
			subtitle: 'Choisis un nouveau mot de passe sécurisé.',
			newPassword: 'Nouveau mot de passe',
			confirmPassword: 'Confirmer le mot de passe',
			changing: 'Modification...',
			changeBtn: 'Changer le mot de passe',
			successTitle: 'Mot de passe modifié',
			successMessage: 'Redirection vers la connexion...',
			passwordMismatch: 'Les mots de passe ne correspondent pas.',
			invalidLink: 'Lien invalide. Redemande un email de réinitialisation.'
		},
		verify: {
			verifying: 'Vérification en cours...',
			successTitle: 'Email vérifié',
			errorTitle: 'Erreur',
			invalidLink: 'Lien de vérification invalide.',
			loginBtn: 'Se connecter'
		},
		footer: 'Skilluv © {year} — Prouve ce que tu sais faire.'
	},
	challenges: {
		title: 'Challenges',
		subtitle: 'Explore, code et gagne des fragments.',
		allDomains: 'Tous',
		allDifficulties: 'Toutes',
		noneFound: 'Aucun challenge trouvé avec ces filtres.',
		locked: 'Prérequis non atteints',
		onboarding: {
			title: 'Premier challenge',
			onboardingLabel: 'Challenge d\'onboarding',
			startBtn: 'Commencer le challenge',
			starting: 'Lancement...',
			hint: '~10 minutes · Ton profil sera créé à la fin',
			minutesLabel: '{n} minutes',
			fragmentsToEarn: 'fragments à gagner'
		},
		detail: {
			backToCatalogue: '← Retour au catalogue',
			instructions: 'Instructions',
			expectedOutput: 'Sortie attendue',
			prerequisite: 'Prérequis : {n} ◆ fragments minimum',
			reward: 'Récompense',
			duration: 'Durée',
			difficulty: 'Difficulté',
			mode: 'Mode',
			startBtn: 'Commencer',
			starting: 'Lancement...',
			noAi: 'IA interdite'
		},
		sandbox: {
			instructions: 'Instructions',
			output: 'Sortie',
			testBtn: 'Tester',
			submitBtn: 'Soumettre',
			executing: 'Exécution...',
			testHint: 'Clique "Tester" pour exécuter ton code.',
			saved: 'Sauvé {time}',
			back: '← Retour',
			resultSuccess: 'Challenge réussi !',
			resultWelcome: 'Bienvenue, Apprenti ☆',
			resultNotYet: 'Pas encore.',
			resultFragments: '+{n} fragments',
			resultPerseverance: '+{n} persévérance',
			retryBtn: 'Retenter',
			viewChallenges: 'Voir les challenges',
			myProfile: 'Mon profil',
			loadingSandbox: 'Chargement de la sandbox...'
		}
	},
	profile: {
		title: 'Profil',
		notFound: 'Profil introuvable.',
		stats: { fragments: 'Fragments', challenges: 'Challenges', streak: 'Streak', trust: 'Confiance' },
		sections: { activity: 'Activité', skills: 'Compétences', badges: 'Badges' },
		noSkills: 'Aucune compétence encore. Complète ton premier challenge !',
		links: { github: 'GitHub', linkedin: 'LinkedIn', twitter: 'X/Twitter', website: 'Site web' }
	},
	leaderboard: {
		title: 'Classements',
		subtitle: 'Top 100 en temps réel.',
		global: 'Global',
		alltime: 'All-time',
		monthly: 'Ce mois',
		weekly: 'Cette semaine',
		yourRank: 'Ton rang',
		score: 'Score',
		participants: 'Participants',
		noParticipants: 'Aucun participant dans ce classement.'
	},
	enterprise: {
		register: {
			title: 'Espace Entreprise',
			subtitle: 'Recrutez sur la base de preuves, pas de CV.',
			companyName: 'Nom de l\'entreprise',
			companySize: 'Taille de l\'entreprise',
			website: 'Site web',
			industry: 'Secteur',
			country: 'Pays',
			createBtn: 'Créer mon espace entreprise',
			creating: 'Création...',
			talentLink: 'Vous êtes un talent ?'
		},
		nav: { dashboard: 'Dashboard', talents: 'Talents', bookmarks: 'Favoris', lists: 'Listes', messages: 'Messages' },
		dashboard: {
			title: 'Dashboard', subtitle: 'Vue d\'ensemble de votre activité de recrutement.',
			myActivity: 'Mon activité', platform: 'Plateforme Skilluv',
			bookmarks: 'Favoris', lists: 'Listes', interests: 'Demandes d\'intérêt',
			conversations: 'Conversations', pending: 'en attente', accepted: 'acceptées',
			totalTalents: 'Talents inscrits', active30d: 'Actifs (30j)',
			avgFragments: 'Fragments moyens', byDomain: 'Par domaine',
			searchTalents: 'Rechercher des talents', viewBookmarks: 'Voir mes favoris'
		},
		talents: {
			title: 'Rechercher des talents', subtitle: 'Trouvez des compétences vérifiées, pas des CV.',
			searchPlaceholder: 'Rechercher par nom, compétence...', searchBtn: 'Rechercher',
			allLevels: 'Tous niveaux', byFragments: 'Par fragments', byRecent: 'Récents', byRelevance: 'Pertinence',
			noResults: 'Aucun talent trouvé avec ces critères.',
			addBookmark: 'Ajouter aux favoris', removeBookmark: 'Retirer des favoris'
		},
		bookmarks: {
			title: 'Favoris', subtitle: 'Talents que vous avez sauvegardés.',
			empty: 'Aucun favori. Recherchez des talents pour en ajouter.',
			emptyAction: 'Rechercher des talents', remove: 'Retirer'
		},
		lists: {
			title: 'Listes de talents', subtitle: 'Organisez vos candidats par liste.',
			newList: '+ Nouvelle liste', cancelBtn: 'Annuler',
			listName: 'Nom de la liste', description: 'Description', createBtn: 'Créer',
			empty: 'Aucune liste créée.', talents: '{n} talent(s)',
			emptyList: 'Cette liste est vide. Ajoutez des talents depuis la recherche.',
			emptyListAction: 'Rechercher des talents', backToLists: '← Retour aux listes'
		},
		messages: {
			title: 'Messages', subtitle: 'Vos conversations avec les talents.',
			empty: 'Aucune conversation. Contactez un talent pour commencer.',
			emptyAction: 'Rechercher des talents',
			closed: 'Conversation fermée', inputPlaceholder: 'Écrire un message...', sendBtn: 'Envoyer'
		},
		types: {
			legend: 'Choisissez le type d\'entreprise',
			stepTitle: 'Quel type d\'entreprise êtes-vous ?',
			stepSubtitle: 'Skilluv adapte votre workspace, votre pipeline et vos options de paiement selon votre type. Modifiable plus tard.',
			stepSubmit: 'Valider le type',
			stepSkip: 'Passer pour l\'instant',
			direct_hire: {
				label: 'Recrutement direct',
				description: 'Vous recrutez pour vos propres équipes.',
				benefit1: 'Pipeline candidats simple',
				benefit2: 'Bookmarks, listes, DM directs',
				benefit3: 'Aucune commission tierce'
			},
			staffing_agency: {
				label: 'Agence de placement',
				description: 'Vous placez des talents chez vos propres clients.',
				benefit1: 'Gestion multi-clients',
				benefit2: 'Attribution talent → client',
				benefit3: 'White-label optionnel'
			},
			remote_international: {
				label: 'Remote international',
				description: 'Vous embauchez à distance via un EOR (Deel, Remote, Oyster).',
				benefit1: 'Config EOR intégrée',
				benefit2: 'Multi-devises + fuseau',
				benefit3: 'Retenues fiscales par pays'
			}
		},
		agencyClients: {
			title: 'Mes clients',
			subtitle: 'Gérez la liste de vos clients pour attribuer les talents en pipeline.',
			addBtn: 'Ajouter un client',
			edit: 'Modifier',
			empty: 'Aucun client pour l\'instant.',
			emptyAction: 'Créer mon premier client',
			nameLabel: 'Nom du client',
			nameError: 'Le nom du client est requis',
			emailLabel: 'Email de contact',
			notesLabel: 'Notes internes',
			activeLabel: 'Client actif',
			saveBtn: 'Enregistrer',
			cancelBtn: 'Annuler',
			deleteBtn: 'Archiver',
			deleteConfirm: 'Archiver ce client ? Les attributions historiques restent visibles.',
			restoreBtn: 'Restaurer',
			archivedBadge: 'Archivé',
			createdOn: 'Créé le {date}',
			ownerOnly: 'Réservé aux comptes agency (staffing_agency).'
		},
		eor: {
			title: 'Configuration EOR',
			subtitle: 'Employer of Record — définit le fournisseur qui gère le contrat, la paie et les retenues fiscales.',
			providerLabel: 'Fournisseur EOR',
			currencyLabel: 'Devise de paiement',
			timezoneLabel: 'Fuseau horaire requis',
			timezoneHint: 'Format IANA (ex. Africa/Porto-Novo, Europe/Paris).',
			taxCountryLabel: 'Pays de retenue fiscale',
			saveBtn: 'Enregistrer la config'
		},
		dashboardCards: {
			agencyClients: 'Clients agence',
			agencyClientsDesc: 'Gérer votre portefeuille clients et les attributions.',
			eorConfig: 'Config EOR',
			eorConfigDesc: 'Fournisseur, devise, fuseau, retenue fiscale.',
			manageType: 'Modifier le type d\'entreprise'
		}
	},
	notifications: {
		title: 'Notifications', markAllRead: 'Tout marquer lu', unread: 'Non lues', all: 'Toutes',
		empty: 'Aucune notification.',
		types: {
			interest_request_received: 'Demande d\'intérêt reçue',
			interest_accepted: 'Demande acceptée',
			interest_declined: 'Demande déclinée',
			new_message: 'Nouveau message',
			challenge_approved: 'Challenge approuvé',
			challenge_rejected: 'Challenge rejeté',
			account_banned: 'Compte suspendu',
			account_unbanned: 'Compte rétabli'
		}
	},
	settings: {
		title: 'Paramètres',
		theme: {
			title: 'Thème', forge: 'Forge', forgeDesc: 'Ocre + terracotta — l\'atelier de l\'artisan',
			vesperal: 'Vespéral', vesperalDesc: 'Bleu nuit + orange braise — la nuit à la lanterne',
			arena: 'Arena', arenaDesc: 'Rouge héraldique + or — le tournoi médiéval',
			scriptorium: 'Scriptorium', scriptoriumDesc: 'Parchemin + encre — le moine copiste',
			sakura: 'Sakura', sakuraDesc: 'Prune + fleur de cerisier — saison des cerisiers'
		},
		language: { title: 'Langue', fr: 'Français', en: 'English' },
		profileSection: {
			title: 'Profil', displayName: 'Nom d\'affichage',
			bio: 'Bio', bioHint: 'Courte description visible sur ton profil'
		},
		password: {
			title: 'Mot de passe', current: 'Mot de passe actuel',
			new: 'Nouveau mot de passe', newHint: '8 caractères minimum', changeBtn: 'Changer le mot de passe'
		},
		privacy: {
			title: 'Confidentialité', showHeatmap: 'Afficher la heatmap',
			showSkillTree: 'Afficher l\'arbre de compétences', showBadges: 'Afficher les badges',
			showStreak: 'Afficher le streak', showEmail: 'Afficher l\'email',
			allowInterests: 'Autoriser les demandes d\'intérêt entreprise'
		},
		security: {
			title: 'Sécurité', twoFa: 'Authentification 2FA (TOTP)',
			twoFaDesc: 'Google Authenticator / Authy', enabled: 'Activé', disabled: 'Désactivé'
		},
		danger: {
			title: 'Zone de danger',
			deleteWarning: 'La suppression est irréversible. Toutes tes données seront effacées conformément au RGPD.',
			deleteBtn: 'Supprimer mon compte', deleteModalTitle: 'Supprimer le compte',
			deleteModalMessage: 'Cette action est irréversible. Entre ton mot de passe pour confirmer.',
			deleteConfirmBtn: 'Supprimer définitivement'
		}
	},
	admin: {
		dashboard: {
			title: 'Dashboard Admin', platform: 'Plateforme', moderation: 'Modération',
			users: 'Utilisateurs', activeUsers: 'actifs (30j)', challenges: 'Challenges', drafts: 'brouillons',
			submissions: 'Soumissions', today: 'aujourd\'hui', wsConnections: 'connexions actives',
			pendingReports: 'Signalements en attente', bans30d: 'Bans (30j)',
			actionsToday: 'Actions admin (aujourd\'hui)', totalReports: 'Total signalements', resolved: 'résolus',
			viewReports: 'Voir les signalements', manageChallenges: 'Gérer les challenges', reviewCommunity: 'Revue communauté'
		},
		reports: {
			title: 'Signalements', pending: 'En attente', resolvedLabel: 'Résolus', dismissed: 'Rejetés', allLabel: 'Tous',
			resolveBtn: 'Résoudre', dismissBtn: 'Rejeter', reportedBy: 'Signalé par', noReports: 'Aucun signalement.'
		},
		users: {
			title: 'Utilisateurs', searchPlaceholder: 'Rechercher...', searchBtn: 'Chercher',
			banBtn: 'Bannir', unbanBtn: 'Débannir', banned: 'Banni', banReason: 'Raison du ban :'
		},
		challenges: { title: 'Challenges', total: 'challenges au total', publishBtn: 'Publier', archiveBtn: 'Archiver' },
		community: {
			title: 'Revue communauté', subtitle: 'Challenges soumis par la communauté en attente de validation.',
			approveBtn: 'Approuver', rejectBtn: 'Rejeter', rejectFeedback: 'Feedback pour le créateur :',
			viewInstructions: 'Voir les instructions', by: 'par', empty: 'Aucun challenge en attente de revue.'
		},
		audit: {
			title: 'Audit log', date: 'Date', admin: 'Admin', action: 'Action', target: 'Cible',
			details: 'Détails', empty: 'Aucune action enregistrée.'
		}
	},
	community: {
		title: 'Challenges communautaires', subtitle: 'Créés par la communauté, votés par les talents.',
		myChallenges: 'Mes challenges', createBtn: 'Créer',
		empty: 'Aucun challenge communautaire pour le moment. Sois le premier !',
		emptyFirst: 'Tu n\'as pas encore créé de challenge.',
		create: {
			title: 'Créer un challenge',
			subtitle: 'Propose un challenge à la communauté. Il sera revu par l\'équipe avant publication.',
			challengeTitle: 'Titre', description: 'Description', instructions: 'Instructions',
			instructionsPlaceholder: 'Les instructions détaillées du challenge...',
			domain: 'Domaine', difficulty: 'Difficulté', language: 'Langage', duration: 'Durée (minutes)',
			durationPlaceholder: 'Pas de limite', expectedOutput: 'Sortie attendue',
			expectedOutputPlaceholder: 'Optionnel — la sortie que le code doit produire',
			submitForReview: 'Soumettre directement pour revue',
			submitForReviewHint: 'sinon sauvegardé en brouillon',
			submitBtn: 'Soumettre pour revue', saveDraft: 'Sauvegarder le brouillon',
			creating: 'Création...', submitted: 'Challenge soumis pour revue !', draftSaved: 'Brouillon sauvegardé.'
		},
		mine: {
			title: 'Mes challenges', empty: 'Tu n\'as pas encore créé de challenge.', createFirst: 'Créer mon premier',
			status: { draft: 'Brouillon', review: 'En revue', approved: 'Approuvé', rejected: 'Rejeté' }
		}
	},
	errors: {
		notFound: 'Page introuvable',
		notFoundMessage: 'Cette page n\'existe pas ou a été déplacée.',
		forbidden: 'Accès refusé',
		forbiddenMessage: 'Tu n\'as pas les permissions pour accéder à cette page.',
		genericTitle: 'Quelque chose a planté',
		genericMessage: 'Une erreur inattendue est survenue.',
		backHome: 'Retour à l\'accueil',
		retryBtn: 'Réessayer',
		generic: 'Une erreur est survenue. Réessaie.'
	},
	push: {
		title: 'Notifications navigateur',
		category: 'Push',
		description: 'Reçois une notif quand un talent te répond, un mentor accepte une session, ta bounty est payée…',
		statusOn: 'Activées',
		statusOff: 'Inactives',
		statusBlocked: 'Bloquées',
		enableBtn: 'Activer les notifications',
		disableBtn: 'Désactiver',
		unsupported: 'Ce navigateur ne supporte pas les notifications push.',
		blockedHint: 'Notifications bloquées dans le navigateur. Change les paramètres du site pour les réactiver.',
		toast: {
			enabled: 'Notifications activées',
			disabled: 'Notifications désactivées',
			permissionDenied: 'Permission refusée',
			receivedFallback: 'Nouvelle notification'
		}
	},
	teams: {
		marketplace: {
			title: 'Marché des équipes',
			subtitle: 'Rejoins un slot ouvert sur un challenge team. Skilluv te matche selon tes orientations et tes compétences prouvées.',
			filters: {
				role: 'Rôle',
				skill: 'Compétence',
				minDifficulty: 'Difficulté min',
				maxDifficulty: 'Difficulté max',
				anyRole: 'Tous les rôles',
				anySkill: 'Toutes les compétences',
				anyDifficulty: 'Toutes',
				apply: 'Filtrer',
				reset: 'Réinitialiser'
			},
			empty: {
				title: 'Aucun slot ouvert.',
				body: 'Reviens plus tard ou ajuste tes filtres.',
				noFilters: 'Aucune équipe ne cherche de talent pour le moment.'
			},
			loadError: 'Impossible de charger le marché. Réessaie plus tard.',
			joinCta: 'Rejoindre',
			viewTeam: 'Voir l\'équipe',
			pageInfo: 'Page {page} sur {total}'
		},
		detail: {
			backToMarketplace: 'Retour au marché',
			membersLabel: 'Membres',
			slotsLabel: 'Slots',
			slotsEmpty: 'Cette équipe est complète.',
			leaveCta: 'Quitter le slot',
			slotFilled: 'Occupé',
			openSlots: 'Slots ouverts',
			minLevel: 'Niveau min {n}',
			skillRequired: 'Compétence requise : {skill}',
			teamNotFound: 'Équipe introuvable.'
		},
		fillDialog: {
			title: 'Rejoindre ce slot ?',
			body: 'Une fois rejoint, tu t\'engages à livrer ta part. Tu pourras quitter tant que le challenge n\'a pas démarré.',
			confirmCta: 'Je rejoins',
			cancelCta: 'Annuler',
			skillCheckLabel: 'Vérification compétence',
			warnLowLevel: 'Ton niveau sur cette compétence est en dessous du minimum requis. Tu peux quand même rejoindre — la team décide.'
		},
		leaveDialog: {
			title: 'Quitter ce slot ?',
			body: 'Ton slot redeviendra ouvert et un autre talent pourra le prendre.',
			confirmCta: 'Je quitte'
		}
	},
	badges: {
		sections: {
			rank: 'Rang',
			patches: 'Compétences prouvées',
			medals: 'Médailles',
			crests: 'Écussons de guilde',
			seal: 'Sceau',
			sealsCount: 'sceaux de challenges',
			stampsCount: 'timbres d\'événements',
			countersLabel: 'Sceaux et timbres'
		},
		rank: {
			achievedOn: 'Depuis le {date}',
			previous: 'Anciennement {previous}'
		},
		empty: {
			own: 'Aucun badge pour l\'instant. Termine ton premier challenge pour en gagner.',
			public: 'Cette personne n\'a pas encore de badges. Invite-la à contribuer.'
		}
	},
	orientations: {
		sectionTitle: 'Orientations métier',
		primary: 'Principale',
		workingLanguages: 'Langues de travail',
		timezone: 'Fuseau',
		selectionOrder: 'Sélection numéro {n}',
		mode: {
			learning: 'En apprentissage',
			active: 'En exercice'
		},
		empty: {
			own: 'Aucune orientation choisie. Ta playlist sera générique tant que tu n\'en choisis pas.',
			public: 'Aucune orientation renseignée.'
		},
		selector: {
			title: 'Choisis tes orientations',
			subtitle: 'Sélectionne jusqu\'à {max} orientations. Ta playlist et ta communauté suivront tes choix.',
			filterLabel: 'Filtrer par domaine',
			allDomains: 'Tous les domaines',
			emptyFilter: 'Aucune orientation dans ce domaine. Change le filtre.',
			summary: 'Ta sélection',
			setPrimary: 'Principale',
			remove: 'Retirer {name}',
			workingLanguagesLabel: 'Langues de travail',
			workingLanguagesHint: 'Codes ISO séparés par des virgules (ex. fr,en,ar).',
			timezoneLabel: 'Fuseau horaire',
			timezoneHint: 'Format IANA (ex. Africa/Porto-Novo). Optionnel.',
			tooMany: 'Maximum {max} orientations. Retire-en une avant d\'en ajouter une autre.',
			mustPickOne: 'Choisis au moins une orientation.',
			submit: 'Valider mes orientations'
		},
		banner: {
			title: 'Choisis tes orientations métier',
			subtitle: 'Ta playlist et tes recommandations Skilluv seront génériques tant que ce n\'est pas fait.',
			cta: 'Choisir'
		},
		softBlock: {
			title: 'Cette section a besoin de tes orientations',
			defaultReason: 'Skilluv personnalise cette page selon les orientations métier que tu choisis. Ça prend 30 secondes.',
			ctaPrimary: 'Choisir maintenant',
			ctaLater: 'Plus tard'
		},
		catalog: {
			title: 'Ton parcours Skilluv',
			subtitle: 'Choisis 1 à 3 orientations. Skilluv construira ta playlist, tes team slots et tes badges autour.',
			loadError: 'Impossible de charger le catalogue des orientations. Réessaie plus tard.',
			savedTitle: 'Orientations enregistrées.',
			savedSubtitle: 'Ta playlist personnalisée est prête sur ton dashboard.',
			continueCta: 'Continuer vers le dashboard'
		},
		detail: {
			backToCatalog: 'Retour au catalogue',
			primaryDomain: 'Domaine principal',
			secondaryDomains: 'Domaines secondaires',
			tags: 'Compétences clés',
			playlistTitle: 'Aperçu de ta playlist',
			playlistSubtitle: 'Voici les 5 premiers items que Skilluv te proposerait si tu choisis cette orientation.',
			playlistEmpty: 'Playlist personnalisée disponible une fois l\'orientation choisie.',
			pickCta: 'Ajouter à ma sélection'
		}
	},
	capabilities: {
		sectionOwnTitle: 'Comment je contribue',
		sectionOwnSubtitle: 'Tes rôles actifs sur Skilluv. Tu peux mentorer, curer, modérer selon ce que tu as gagné.',
		sectionPublicTitle: 'Comment cette personne contribue',
		sectionPublicSubtitle: 'Rôles actifs sur Skilluv, gagnés par les preuves.',
		empty: 'Aucun rôle actif pour l\'instant. Continue à contribuer, ils viendront.',
		expiresOn: 'Expire le {date}',
		grantedOn: 'Obtenu le {date}',
		items: {
			challenger: { label: 'Challenger', description: 'Résout des challenges publiés et gagne des fragments.' },
			mentor: { label: 'Mentor', description: 'Anime des sessions 1-on-1 avec les talents.' },
			project_steward: { label: 'Steward projet', description: 'Coordonne un projet communautaire, arbitre les slots.' },
			pr_reviewer: { label: 'Reviewer PR', description: 'Valide les pull requests des bounties open-source.' },
			bounty_funder: { label: 'Sponsor bounty', description: 'Finance des issues GitHub pour la communauté.' },
			issue_proposer: { label: 'Proposeur d\'issues', description: 'Suggère des issues à transformer en bounties.' },
			jury_tournament: { label: 'Juré tournoi', description: 'Note les rendus lors d\'un tournoi.' },
			admin: { label: 'Administrateur', description: 'Accès plateforme complet.' },
			enterprise_recruiter: { label: 'Recruteur entreprise', description: 'Sourcing talents pour un compte entreprise.' },
			community_moderator: { label: 'Modérateur communauté', description: 'Modère les espaces communautaires transverses.' },
			forum_moderator: { label: 'Modérateur forum', description: 'Supprime spam et abus sur le forum.' },
			plagiarism_reviewer: { label: 'Reviewer plagiat', description: 'Décide de la validité des deliverables flaggés.' },
			kyc_reviewer: { label: 'Reviewer KYC', description: 'Valide les documents d\'identité des payouts.' },
			community_curator: { label: 'Curator communauté', description: 'Approuve ou rejette les challenges communautaires en revue.' }
		},
		nav: {
			forumModeration: 'Modération forum',
			pendingCurator: 'File curator',
			plagiarismQueue: 'Review plagiat',
			mentorZone: 'Espace mentor',
			juryTournament: 'Jury tournoi'
		}
	}
};
