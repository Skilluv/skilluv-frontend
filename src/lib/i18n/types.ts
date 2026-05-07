export interface Translations {
	common: {
		actions: {
			save: string;
			cancel: string;
			delete: string;
			edit: string;
			search: string;
			retry: string;
			back: string;
			next: string;
			previous: string;
			submit: string;
			confirm: string;
			close: string;
			create: string;
			loading: string;
			sending: string;
		};
		nav: {
			home: string;
			challenges: string;
			leaderboards: string;
			profile: string;
			settings: string;
			notifications: string;
			login: string;
			register: string;
			logout: string;
			community: string;
		};
		domains: {
			code: string;
			design: string;
			game: string;
			security: string;
		};
		titles: {
			apprenti: string;
			artisan: string;
			maitre: string;
			legende: string;
		};
		difficulty: {
			1: string;
			2: string;
			3: string;
			4: string;
			5: string;
		};
		tone: {
			serious: string;
			fun: string;
			educational: string;
		};
		time: {
			minutes: string;
			hours: string;
			noLimit: string;
			ago: string;
		};
		fragments: string;
		streak: string;
		team: string;
		votes: string;
		page: string;
	};
	landing: {
		title: string;
		titleAccent: string;
		subtitle: string;
		cta: string;
		ctaSecondary: string;
		statDomains: string;
		statLanguages: string;
		statFree: string;
	};
	dashboard: {
		greeting: string;
		cardChallenges: string;
		cardChallengesDesc: string;
		cardProfile: string;
		cardProfileDesc: string;
		cardLeaderboards: string;
		cardLeaderboardsDesc: string;
	};
	auth: {
		register: {
			pickDomain: string;
			pickDomainSub: string;
			codeDesc: string;
			designDesc: string;
			gameDesc: string;
			securityDesc: string;
			changeDomain: string;
			createAccount: string;
			domain: string;
			username: string;
			email: string;
			firstName: string;
			lastName: string;
			password: string;
			passwordHint: string;
			creating: string;
			createBtn: string;
			hasAccount: string;
			loginLink: string;
		};
		login: {
			title: string;
			subtitle: string;
			identifier: string;
			password: string;
			forgotPassword: string;
			totpLabel: string;
			email2faMessage: string;
			email2faLabel: string;
			loggingIn: string;
			loginBtn: string;
			noAccount: string;
			registerLink: string;
		};
		forgot: {
			title: string;
			subtitle: string;
			sendLink: string;
			sending: string;
			sentTitle: string;
			sentMessage: string;
			backToLogin: string;
		};
		reset: {
			title: string;
			subtitle: string;
			newPassword: string;
			confirmPassword: string;
			changing: string;
			changeBtn: string;
			successTitle: string;
			successMessage: string;
			passwordMismatch: string;
			invalidLink: string;
		};
		verify: {
			verifying: string;
			successTitle: string;
			errorTitle: string;
			invalidLink: string;
			loginBtn: string;
		};
		footer: string;
	};
	challenges: {
		title: string;
		subtitle: string;
		allDomains: string;
		allDifficulties: string;
		noneFound: string;
		locked: string;
		onboarding: {
			title: string;
			onboardingLabel: string;
			startBtn: string;
			starting: string;
			hint: string;
			minutesLabel: string;
			fragmentsToEarn: string;
		};
		detail: {
			backToCatalogue: string;
			instructions: string;
			expectedOutput: string;
			prerequisite: string;
			reward: string;
			duration: string;
			difficulty: string;
			mode: string;
			startBtn: string;
			starting: string;
			noAi: string;
		};
		sandbox: {
			instructions: string;
			output: string;
			testBtn: string;
			submitBtn: string;
			executing: string;
			testHint: string;
			saved: string;
			back: string;
			resultSuccess: string;
			resultWelcome: string;
			resultNotYet: string;
			resultFragments: string;
			resultPerseverance: string;
			retryBtn: string;
			viewChallenges: string;
			myProfile: string;
			loadingSandbox: string;
		};
	};
	profile: {
		title: string;
		notFound: string;
		stats: {
			fragments: string;
			challenges: string;
			streak: string;
			trust: string;
		};
		sections: {
			activity: string;
			skills: string;
			badges: string;
		};
		noSkills: string;
		links: {
			github: string;
			linkedin: string;
			twitter: string;
			website: string;
		};
	};
	leaderboard: {
		title: string;
		subtitle: string;
		global: string;
		alltime: string;
		monthly: string;
		weekly: string;
		yourRank: string;
		score: string;
		participants: string;
		noParticipants: string;
	};
	enterprise: {
		register: {
			title: string;
			subtitle: string;
			companyName: string;
			companySize: string;
			website: string;
			industry: string;
			country: string;
			createBtn: string;
			creating: string;
			talentLink: string;
		};
		nav: {
			dashboard: string;
			talents: string;
			bookmarks: string;
			lists: string;
			messages: string;
		};
		dashboard: {
			title: string;
			subtitle: string;
			myActivity: string;
			platform: string;
			bookmarks: string;
			lists: string;
			interests: string;
			conversations: string;
			pending: string;
			accepted: string;
			totalTalents: string;
			active30d: string;
			avgFragments: string;
			byDomain: string;
			searchTalents: string;
			viewBookmarks: string;
		};
		talents: {
			title: string;
			subtitle: string;
			searchPlaceholder: string;
			searchBtn: string;
			allLevels: string;
			byFragments: string;
			byRecent: string;
			byRelevance: string;
			noResults: string;
			addBookmark: string;
			removeBookmark: string;
		};
		bookmarks: {
			title: string;
			subtitle: string;
			empty: string;
			emptyAction: string;
			remove: string;
		};
		lists: {
			title: string;
			subtitle: string;
			newList: string;
			cancelBtn: string;
			listName: string;
			description: string;
			createBtn: string;
			empty: string;
			talents: string;
			emptyList: string;
			emptyListAction: string;
			backToLists: string;
		};
		messages: {
			title: string;
			subtitle: string;
			empty: string;
			emptyAction: string;
			closed: string;
			inputPlaceholder: string;
			sendBtn: string;
		};
	};
	notifications: {
		title: string;
		markAllRead: string;
		unread: string;
		all: string;
		empty: string;
		types: {
			interest_request_received: string;
			interest_accepted: string;
			interest_declined: string;
			new_message: string;
			challenge_approved: string;
			challenge_rejected: string;
			account_banned: string;
			account_unbanned: string;
		};
	};
	settings: {
		title: string;
		theme: {
			title: string;
			forge: string;
			forgeDesc: string;
			neon: string;
			neonDesc: string;
			arena: string;
			arenaDesc: string;
			terminal: string;
			terminalDesc: string;
			sakura: string;
			sakuraDesc: string;
		};
		language: {
			title: string;
			fr: string;
			en: string;
		};
		profileSection: {
			title: string;
			displayName: string;
			bio: string;
			bioHint: string;
		};
		password: {
			title: string;
			current: string;
			new: string;
			newHint: string;
			changeBtn: string;
		};
		privacy: {
			title: string;
			showHeatmap: string;
			showSkillTree: string;
			showBadges: string;
			showStreak: string;
			showEmail: string;
			allowInterests: string;
		};
		security: {
			title: string;
			twoFa: string;
			twoFaDesc: string;
			enabled: string;
			disabled: string;
		};
		danger: {
			title: string;
			deleteWarning: string;
			deleteBtn: string;
			deleteModalTitle: string;
			deleteModalMessage: string;
			deleteConfirmBtn: string;
		};
	};
	admin: {
		dashboard: {
			title: string;
			platform: string;
			moderation: string;
			users: string;
			activeUsers: string;
			challenges: string;
			drafts: string;
			submissions: string;
			today: string;
			wsConnections: string;
			pendingReports: string;
			bans30d: string;
			actionsToday: string;
			totalReports: string;
			resolved: string;
			viewReports: string;
			manageChallenges: string;
			reviewCommunity: string;
		};
		reports: {
			title: string;
			pending: string;
			resolvedLabel: string;
			dismissed: string;
			allLabel: string;
			resolveBtn: string;
			dismissBtn: string;
			reportedBy: string;
			noReports: string;
		};
		users: {
			title: string;
			searchPlaceholder: string;
			searchBtn: string;
			banBtn: string;
			unbanBtn: string;
			banned: string;
			banReason: string;
		};
		challenges: {
			title: string;
			total: string;
			publishBtn: string;
			archiveBtn: string;
		};
		community: {
			title: string;
			subtitle: string;
			approveBtn: string;
			rejectBtn: string;
			rejectFeedback: string;
			viewInstructions: string;
			by: string;
			empty: string;
		};
		audit: {
			title: string;
			date: string;
			admin: string;
			action: string;
			target: string;
			details: string;
			empty: string;
		};
	};
	community: {
		title: string;
		subtitle: string;
		myChallenges: string;
		createBtn: string;
		empty: string;
		emptyFirst: string;
		create: {
			title: string;
			subtitle: string;
			challengeTitle: string;
			description: string;
			instructions: string;
			instructionsPlaceholder: string;
			domain: string;
			difficulty: string;
			language: string;
			duration: string;
			durationPlaceholder: string;
			expectedOutput: string;
			expectedOutputPlaceholder: string;
			submitForReview: string;
			submitForReviewHint: string;
			submitBtn: string;
			saveDraft: string;
			creating: string;
			submitted: string;
			draftSaved: string;
		};
		mine: {
			title: string;
			empty: string;
			createFirst: string;
			status: {
				draft: string;
				review: string;
				approved: string;
				rejected: string;
			};
		};
	};
	errors: {
		notFound: string;
		notFoundMessage: string;
		forbidden: string;
		forbiddenMessage: string;
		genericTitle: string;
		genericMessage: string;
		backHome: string;
		retryBtn: string;
		generic: string;
	};
}
