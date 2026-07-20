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
			ranger: string;
			artisan: string;
			maitre: string;
			doyen: string;
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
		types: {
			legend: string;
			stepTitle: string;
			stepSubtitle: string;
			stepSubmit: string;
			stepSkip: string;
			direct_hire: {
				label: string;
				description: string;
				benefit1: string;
				benefit2: string;
				benefit3: string;
			};
			staffing_agency: {
				label: string;
				description: string;
				benefit1: string;
				benefit2: string;
				benefit3: string;
			};
			remote_international: {
				label: string;
				description: string;
				benefit1: string;
				benefit2: string;
				benefit3: string;
			};
		};
		agencyClients: {
			title: string;
			subtitle: string;
			addBtn: string;
			edit: string;
			empty: string;
			emptyAction: string;
			nameLabel: string;
			nameError: string;
			emailLabel: string;
			notesLabel: string;
			activeLabel: string;
			saveBtn: string;
			cancelBtn: string;
			deleteBtn: string;
			deleteConfirm: string;
			restoreBtn: string;
			archivedBadge: string;
			createdOn: string;
			ownerOnly: string;
		};
		eor: {
			title: string;
			subtitle: string;
			providerLabel: string;
			currencyLabel: string;
			timezoneLabel: string;
			timezoneHint: string;
			taxCountryLabel: string;
			saveBtn: string;
		};
		dashboardCards: {
			agencyClients: string;
			agencyClientsDesc: string;
			eorConfig: string;
			eorConfigDesc: string;
			manageType: string;
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
			vesperal: string;
			vesperalDesc: string;
			arena: string;
			arenaDesc: string;
			scriptorium: string;
			scriptoriumDesc: string;
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
	wallet: {
		title: string;
		subtitle: string;
		balanceLabel: string;
		balanceFragments: string;
		balanceEur: string;
		lastUpdated: string;
		requestPayoutCta: string;
		downloadStatement: string;
		historyTitle: string;
		historyEmpty: string;
		payoutsTitle: string;
		payoutsEmpty: string;
		loadError: string;
		tx: {
			earn: string;
			payout: string;
			adjustment: string;
			entryHash: string;
		};
		payoutStatus: {
			pending: string;
			processing: string;
			paid: string;
			failed: string;
			cancelled: string;
		};
		payoutModal: {
			title: string;
			amountLabel: string;
			amountHint: string;
			amountBelowMin: string;
			amountAboveBalance: string;
			methodLabel: string;
			methodStripeLabel: string;
			methodStripeDesc: string;
			methodMomoLabel: string;
			methodMomoDesc: string;
			stripe: {
				notConnected: string;
				connectCta: string;
				connectingLabel: string;
				readyLabel: string;
				accountLabel: string;
				countryLabel: string;
			};
			momo: {
				providerLabel: string;
				providerOrange: string;
				providerMtn: string;
				providerWave: string;
				numberLabel: string;
				numberHint: string;
				numberRequired: string;
				registerCta: string;
				verifiedLabel: string;
			};
			submit: string;
			cancel: string;
			submitted: string;
		};
	};
	moderation: {
		buttonLabel: string;
		reasonLabel: string;
		reasonRequired: string;
		reasonPlaceholder: string;
		confirmDanger: string;
		cancel: string;
		durationHours: string;
		toast: {
			done: string;
			failed: string;
		};
		forum: {
			actionHide: string;
			actionUnhide: string;
			actionLock: string;
			actionUnlock: string;
			actionMuteAuthor: string;
			menuLabel: string;
			menuOpen: string;
			confirmHideBody: string;
			confirmUnhideBody: string;
			confirmLockBody: string;
			confirmUnlockBody: string;
			confirmMuteBody: string;
			muteDuration24: string;
			muteDuration72: string;
			muteDuration168: string;
		};
		community: {
			approveCta: string;
			rejectCta: string;
			confirmApproveTitle: string;
			confirmApproveBody: string;
			confirmRejectTitle: string;
			confirmRejectBody: string;
		};
		plagiarism: {
			title: string;
			subtitle: string;
			queueEmpty: string;
			scoreLabel: string;
			flaggedOn: string;
			viewDeliverable: string;
			markValidCta: string;
			revokeCta: string;
			confirmValidTitle: string;
			confirmValidBody: string;
			confirmRevokeTitle: string;
			confirmRevokeBody: string;
			noAccess: string;
		};
	};
	events: {
		title: string;
		subtitle: string;
		active: string;
		upcoming: string;
		ended: string;
		partner: string;
		empty: string;
		loadError: string;
		joinCta: string;
		joinedCta: string;
		alreadyJoined: string;
		backToList: string;
		myEventsTitle: string;
		myEventsEmpty: string;
		startsOn: string;
		endsOn: string;
		stampEarned: string;
	};
	privacyPage: {
		title: string;
		subtitle: string;
		consents: {
			title: string;
			subtitle: string;
			marketingLabel: string;
			marketingHint: string;
			analyticsLabel: string;
			analyticsHint: string;
			saved: string;
		};
		gdpr: {
			title: string;
			subtitle: string;
			requestCta: string;
			pending: string;
			ready: string;
			downloadCta: string;
			failed: string;
		};
		dataExport: {
			title: string;
			subtitle: string;
			requestCta: string;
		};
		delete: {
			title: string;
			subtitle: string;
			requestCta: string;
			modalTitle: string;
			modalBody: string;
			reasonLabel: string;
			cancelCta: string;
			confirmCta: string;
			scheduled: string;
		};
	};
	seasons: {
		currentLabel: string;
		endsOn: string;
		selectorLabel: string;
		allTime: string;
	};
	push: {
		title: string;
		category: string;
		description: string;
		statusOn: string;
		statusOff: string;
		statusBlocked: string;
		enableBtn: string;
		disableBtn: string;
		unsupported: string;
		blockedHint: string;
		toast: {
			enabled: string;
			disabled: string;
			permissionDenied: string;
			receivedFallback: string;
		};
	};
	teams: {
		marketplace: {
			title: string;
			subtitle: string;
			filters: {
				role: string;
				skill: string;
				minDifficulty: string;
				maxDifficulty: string;
				anyRole: string;
				anySkill: string;
				anyDifficulty: string;
				apply: string;
				reset: string;
			};
			empty: {
				title: string;
				body: string;
				noFilters: string;
			};
			loadError: string;
			joinCta: string;
			viewTeam: string;
			pageInfo: string;
		};
		detail: {
			backToMarketplace: string;
			membersLabel: string;
			slotsLabel: string;
			slotsEmpty: string;
			leaveCta: string;
			slotFilled: string;
			openSlots: string;
			minLevel: string;
			skillRequired: string;
			teamNotFound: string;
		};
		fillDialog: {
			title: string;
			body: string;
			confirmCta: string;
			cancelCta: string;
			skillCheckLabel: string;
			warnLowLevel: string;
		};
		leaveDialog: {
			title: string;
			body: string;
			confirmCta: string;
		};
	};
	badges: {
		sections: {
			rank: string;
			patches: string;
			medals: string;
			crests: string;
			seal: string;
			sealsCount: string;
			stampsCount: string;
			countersLabel: string;
		};
		rank: {
			achievedOn: string;
			previous: string;
		};
		empty: {
			own: string;
			public: string;
		};
	};
	orientations: {
		sectionTitle: string;
		primary: string;
		workingLanguages: string;
		timezone: string;
		selectionOrder: string;
		mode: {
			learning: string;
			active: string;
		};
		empty: {
			own: string;
			public: string;
		};
		selector: {
			title: string;
			subtitle: string;
			filterLabel: string;
			allDomains: string;
			emptyFilter: string;
			summary: string;
			setPrimary: string;
			remove: string;
			workingLanguagesLabel: string;
			workingLanguagesHint: string;
			timezoneLabel: string;
			timezoneHint: string;
			tooMany: string;
			mustPickOne: string;
			submit: string;
		};
		banner: {
			title: string;
			subtitle: string;
			cta: string;
		};
		softBlock: {
			title: string;
			defaultReason: string;
			ctaPrimary: string;
			ctaLater: string;
		};
		catalog: {
			title: string;
			subtitle: string;
			loadError: string;
			savedTitle: string;
			savedSubtitle: string;
			continueCta: string;
		};
		detail: {
			backToCatalog: string;
			primaryDomain: string;
			secondaryDomains: string;
			tags: string;
			playlistTitle: string;
			playlistSubtitle: string;
			playlistEmpty: string;
			pickCta: string;
		};
	};
	capabilities: {
		sectionOwnTitle: string;
		sectionOwnSubtitle: string;
		sectionPublicTitle: string;
		sectionPublicSubtitle: string;
		empty: string;
		expiresOn: string;
		grantedOn: string;
		items: {
			challenger: { label: string; description: string };
			mentor: { label: string; description: string };
			project_steward: { label: string; description: string };
			pr_reviewer: { label: string; description: string };
			bounty_funder: { label: string; description: string };
			issue_proposer: { label: string; description: string };
			jury_tournament: { label: string; description: string };
			admin: { label: string; description: string };
			enterprise_recruiter: { label: string; description: string };
			community_moderator: { label: string; description: string };
			forum_moderator: { label: string; description: string };
			plagiarism_reviewer: { label: string; description: string };
			kyc_reviewer: { label: string; description: string };
			community_curator: { label: string; description: string };
		};
		nav: {
			forumModeration: string;
			pendingCurator: string;
			plagiarismQueue: string;
			mentorZone: string;
			juryTournament: string;
		};
	};
}
