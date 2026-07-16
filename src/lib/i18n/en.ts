import type { Translations } from './types';

export const en: Translations = {
	common: {
		actions: {
			save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
			search: 'Search', retry: 'Retry', back: 'Back', next: 'Next',
			previous: 'Previous', submit: 'Submit', confirm: 'Confirm', close: 'Close',
			create: 'Create', loading: 'Loading...', sending: 'Sending...'
		},
		nav: {
			home: 'Home', challenges: 'Challenges', leaderboards: 'Leaderboards',
			profile: 'Profile', settings: 'Settings', notifications: 'Notifications',
			login: 'Log in', register: 'Get started', logout: 'Log out', community: 'Community'
		},
		domains: { code: 'Code', design: 'Design', game: 'Game Dev', security: 'Cybersecurity' },
		titles: { apprenti: 'Apprentice', ranger: 'Ranger', artisan: 'Artisan', maitre: 'Master', doyen: 'Elder', legende: 'Legend' },
		difficulty: { 1: 'Beginner', 2: 'Easy', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' },
		tone: { serious: 'Serious', fun: 'Fun', educational: 'Educational' },
		time: { minutes: '{n} min', hours: '{n}h', noLimit: 'No limit', ago: 'ago' },
		fragments: 'fragments', streak: 'Streak', team: 'Team', votes: 'votes', page: 'Page'
	},
	landing: {
		title: 'Prove what you can do.',
		titleAccent: 'For real.',
		subtitle: 'Skilluv is the platform where tech talents prove their skills through concrete challenges. No resume. No self-declaration. Only proof.',
		cta: 'Get started for free',
		ctaSecondary: 'Browse challenges',
		statDomains: 'Domains',
		statLanguages: 'Languages',
		statFree: 'Free'
	},
	dashboard: {
		greeting: 'Hey, {name}',
		cardChallenges: 'Challenges',
		cardChallengesDesc: 'Explore and complete challenges to earn fragments.',
		cardProfile: 'My Profile',
		cardProfileDesc: 'Your living profile, generated from your proof.',
		cardLeaderboards: 'Leaderboards',
		cardLeaderboardsDesc: 'Real-time Top 100 by domain and country.'
	},
	auth: {
		register: {
			pickDomain: 'What are you passionate about?',
			pickDomainSub: 'Pick your main domain. You can explore others later.',
			codeDesc: 'Web, mobile, backend development, algorithms...',
			designDesc: 'UI/UX, graphic design, illustration, motion design...',
			gameDesc: 'Game design, development, 3D, narrative...',
			securityDesc: 'Pentesting, CTF, forensics, cryptography...',
			changeDomain: '← Change domain',
			createAccount: 'Create your account',
			domain: 'Domain',
			username: 'Username',
			email: 'Email',
			firstName: 'First name',
			lastName: 'Last name',
			password: 'Password',
			passwordHint: '8 characters minimum',
			creating: 'Creating...',
			createBtn: 'Create my account',
			hasAccount: 'Already have an account?',
			loginLink: 'Log in'
		},
		login: {
			title: 'Welcome back',
			subtitle: 'Log in to continue your journey.',
			identifier: 'Email or username',
			password: 'Password',
			forgotPassword: 'Forgot password?',
			totpLabel: 'TOTP code (Google Authenticator)',
			email2faMessage: 'A code has been sent to your email.',
			email2faLabel: 'Verification code',
			loggingIn: 'Logging in...',
			loginBtn: 'Log in',
			noAccount: 'No account yet?',
			registerLink: 'Create an account'
		},
		forgot: {
			title: 'Forgot password',
			subtitle: 'Enter your email, we\'ll send you a reset link.',
			sendLink: 'Send link',
			sending: 'Sending...',
			sentTitle: 'Email sent',
			sentMessage: 'If an account exists with this email, you\'ll receive a reset link.',
			backToLogin: 'Back to login'
		},
		reset: {
			title: 'New password',
			subtitle: 'Choose a new secure password.',
			newPassword: 'New password',
			confirmPassword: 'Confirm password',
			changing: 'Changing...',
			changeBtn: 'Change password',
			successTitle: 'Password changed',
			successMessage: 'Redirecting to login...',
			passwordMismatch: 'Passwords don\'t match.',
			invalidLink: 'Invalid link. Request a new reset email.'
		},
		verify: {
			verifying: 'Verifying...',
			successTitle: 'Email verified',
			errorTitle: 'Error',
			invalidLink: 'Invalid verification link.',
			loginBtn: 'Log in'
		},
		footer: 'Skilluv © {year} — Prove what you can do.'
	},
	challenges: {
		title: 'Challenges',
		subtitle: 'Explore, code, and earn fragments.',
		allDomains: 'All',
		allDifficulties: 'All',
		noneFound: 'No challenges found with these filters.',
		locked: 'Prerequisites not met',
		onboarding: {
			title: 'First challenge',
			onboardingLabel: 'Onboarding challenge',
			startBtn: 'Start the challenge',
			starting: 'Starting...',
			hint: '~10 minutes · Your profile will be created at the end',
			minutesLabel: '{n} minutes',
			fragmentsToEarn: 'fragments to earn'
		},
		detail: {
			backToCatalogue: '← Back to catalogue',
			instructions: 'Instructions',
			expectedOutput: 'Expected output',
			prerequisite: 'Prerequisite: {n} ◆ fragments minimum',
			reward: 'Reward',
			duration: 'Duration',
			difficulty: 'Difficulty',
			mode: 'Mode',
			startBtn: 'Start',
			starting: 'Starting...',
			noAi: 'AI not allowed'
		},
		sandbox: {
			instructions: 'Instructions',
			output: 'Output',
			testBtn: 'Test',
			submitBtn: 'Submit',
			executing: 'Running...',
			testHint: 'Click "Test" to run your code.',
			saved: 'Saved {time}',
			back: '← Back',
			resultSuccess: 'Challenge completed!',
			resultWelcome: 'Welcome, Apprentice ☆',
			resultNotYet: 'Not yet.',
			resultFragments: '+{n} fragments',
			resultPerseverance: '+{n} perseverance',
			retryBtn: 'Retry',
			viewChallenges: 'View challenges',
			myProfile: 'My profile',
			loadingSandbox: 'Loading sandbox...'
		}
	},
	profile: {
		title: 'Profile',
		notFound: 'Profile not found.',
		stats: { fragments: 'Fragments', challenges: 'Challenges', streak: 'Streak', trust: 'Trust' },
		sections: { activity: 'Activity', skills: 'Skills', badges: 'Badges' },
		noSkills: 'No skills yet. Complete your first challenge!',
		links: { github: 'GitHub', linkedin: 'LinkedIn', twitter: 'X/Twitter', website: 'Website' }
	},
	leaderboard: {
		title: 'Leaderboards',
		subtitle: 'Real-time Top 100.',
		global: 'Global',
		alltime: 'All-time',
		monthly: 'This month',
		weekly: 'This week',
		yourRank: 'Your rank',
		score: 'Score',
		participants: 'Participants',
		noParticipants: 'No participants in this leaderboard.'
	},
	enterprise: {
		register: {
			title: 'Enterprise Space',
			subtitle: 'Recruit based on proof, not resumes.',
			companyName: 'Company name',
			companySize: 'Company size',
			website: 'Website',
			industry: 'Industry',
			country: 'Country',
			createBtn: 'Create my enterprise space',
			creating: 'Creating...',
			talentLink: 'Are you a talent?'
		},
		nav: { dashboard: 'Dashboard', talents: 'Talents', bookmarks: 'Bookmarks', lists: 'Lists', messages: 'Messages' },
		dashboard: {
			title: 'Dashboard', subtitle: 'Overview of your recruitment activity.',
			myActivity: 'My activity', platform: 'Skilluv Platform',
			bookmarks: 'Bookmarks', lists: 'Lists', interests: 'Interest requests',
			conversations: 'Conversations', pending: 'pending', accepted: 'accepted',
			totalTalents: 'Registered talents', active30d: 'Active (30d)',
			avgFragments: 'Average fragments', byDomain: 'By domain',
			searchTalents: 'Search talents', viewBookmarks: 'View bookmarks'
		},
		talents: {
			title: 'Search talents', subtitle: 'Find verified skills, not resumes.',
			searchPlaceholder: 'Search by name, skill...', searchBtn: 'Search',
			allLevels: 'All levels', byFragments: 'By fragments', byRecent: 'Recent', byRelevance: 'Relevance',
			noResults: 'No talent found with these criteria.',
			addBookmark: 'Add to bookmarks', removeBookmark: 'Remove from bookmarks'
		},
		bookmarks: {
			title: 'Bookmarks', subtitle: 'Talents you\'ve saved.',
			empty: 'No bookmarks. Search for talents to add some.',
			emptyAction: 'Search talents', remove: 'Remove'
		},
		lists: {
			title: 'Talent lists', subtitle: 'Organize your candidates by list.',
			newList: '+ New list', cancelBtn: 'Cancel',
			listName: 'List name', description: 'Description', createBtn: 'Create',
			empty: 'No lists created.', talents: '{n} talent(s)',
			emptyList: 'This list is empty. Add talents from search.',
			emptyListAction: 'Search talents', backToLists: '← Back to lists'
		},
		messages: {
			title: 'Messages', subtitle: 'Your conversations with talents.',
			empty: 'No conversations. Contact a talent to get started.',
			emptyAction: 'Search talents',
			closed: 'Conversation closed', inputPlaceholder: 'Write a message...', sendBtn: 'Send'
		},
		types: {
			legend: 'Pick the enterprise type',
			stepTitle: 'What type of enterprise are you?',
			stepSubtitle: 'Skilluv tailors your workspace, pipeline and payment options to your type. Editable later.',
			stepSubmit: 'Save type',
			stepSkip: 'Skip for now',
			direct_hire: {
				label: 'Direct hire',
				description: 'You recruit for your own teams.',
				benefit1: 'Simple candidate pipeline',
				benefit2: 'Bookmarks, lists, direct DMs',
				benefit3: 'No third-party commission'
			},
			staffing_agency: {
				label: 'Staffing agency',
				description: 'You place talents at your own clients.',
				benefit1: 'Multi-client management',
				benefit2: 'Talent → client assignment',
				benefit3: 'Optional white-label'
			},
			remote_international: {
				label: 'Remote international',
				description: 'You hire remotely via an EOR (Deel, Remote, Oyster).',
				benefit1: 'Integrated EOR config',
				benefit2: 'Multi-currency + timezone',
				benefit3: 'Country-based tax withholding'
			}
		},
		agencyClients: {
			title: 'My clients',
			subtitle: 'Manage your client list to assign talents in the pipeline.',
			addBtn: 'Add a client',
			edit: 'Edit',
			empty: 'No clients yet.',
			emptyAction: 'Create my first client',
			nameLabel: 'Client name',
			nameError: 'Client name is required',
			emailLabel: 'Contact email',
			notesLabel: 'Internal notes',
			activeLabel: 'Active client',
			saveBtn: 'Save',
			cancelBtn: 'Cancel',
			deleteBtn: 'Archive',
			deleteConfirm: 'Archive this client? Historical assignments stay visible.',
			restoreBtn: 'Restore',
			archivedBadge: 'Archived',
			createdOn: 'Created {date}',
			ownerOnly: 'Reserved to agency accounts (staffing_agency).'
		},
		eor: {
			title: 'EOR configuration',
			subtitle: 'Employer of Record — sets the provider handling contract, payroll and tax withholding.',
			providerLabel: 'EOR provider',
			currencyLabel: 'Payment currency',
			timezoneLabel: 'Required timezone',
			timezoneHint: 'IANA format (e.g. Africa/Porto-Novo, Europe/Paris).',
			taxCountryLabel: 'Tax withholding country',
			saveBtn: 'Save config'
		},
		dashboardCards: {
			agencyClients: 'Agency clients',
			agencyClientsDesc: 'Manage your client portfolio and assignments.',
			eorConfig: 'EOR config',
			eorConfigDesc: 'Provider, currency, timezone, tax withholding.',
			manageType: 'Edit enterprise type'
		}
	},
	notifications: {
		title: 'Notifications', markAllRead: 'Mark all as read', unread: 'Unread', all: 'All',
		empty: 'No notifications.',
		types: {
			interest_request_received: 'Interest request received',
			interest_accepted: 'Request accepted',
			interest_declined: 'Request declined',
			new_message: 'New message',
			challenge_approved: 'Challenge approved',
			challenge_rejected: 'Challenge rejected',
			account_banned: 'Account suspended',
			account_unbanned: 'Account restored'
		}
	},
	settings: {
		title: 'Settings',
		theme: {
			title: 'Theme', forge: 'Forge', forgeDesc: 'Ochre + terracotta — the artisan\'s workshop',
			vesperal: 'Vespéral', vesperalDesc: 'Deep blue + ember orange — lantern-lit night',
			arena: 'Arena', arenaDesc: 'Heraldic red + gold — medieval tournament',
			scriptorium: 'Scriptorium', scriptoriumDesc: 'Parchment + ink — the copyist monk',
			sakura: 'Sakura', sakuraDesc: 'Plum + cherry blossom — cherry season'
		},
		language: { title: 'Language', fr: 'Français', en: 'English' },
		profileSection: {
			title: 'Profile', displayName: 'Display name',
			bio: 'Bio', bioHint: 'Short description visible on your profile'
		},
		password: {
			title: 'Password', current: 'Current password',
			new: 'New password', newHint: '8 characters minimum', changeBtn: 'Change password'
		},
		privacy: {
			title: 'Privacy', showHeatmap: 'Show heatmap',
			showSkillTree: 'Show skill tree', showBadges: 'Show badges',
			showStreak: 'Show streak', showEmail: 'Show email',
			allowInterests: 'Allow enterprise interest requests'
		},
		security: {
			title: 'Security', twoFa: '2FA Authentication (TOTP)',
			twoFaDesc: 'Google Authenticator / Authy', enabled: 'Enabled', disabled: 'Disabled'
		},
		danger: {
			title: 'Danger zone',
			deleteWarning: 'Deletion is irreversible. All your data will be erased per GDPR.',
			deleteBtn: 'Delete my account', deleteModalTitle: 'Delete account',
			deleteModalMessage: 'This action is irreversible. Enter your password to confirm.',
			deleteConfirmBtn: 'Delete permanently'
		}
	},
	admin: {
		dashboard: {
			title: 'Admin Dashboard', platform: 'Platform', moderation: 'Moderation',
			users: 'Users', activeUsers: 'active (30d)', challenges: 'Challenges', drafts: 'drafts',
			submissions: 'Submissions', today: 'today', wsConnections: 'active connections',
			pendingReports: 'Pending reports', bans30d: 'Bans (30d)',
			actionsToday: 'Admin actions (today)', totalReports: 'Total reports', resolved: 'resolved',
			viewReports: 'View reports', manageChallenges: 'Manage challenges', reviewCommunity: 'Review community'
		},
		reports: {
			title: 'Reports', pending: 'Pending', resolvedLabel: 'Resolved', dismissed: 'Dismissed', allLabel: 'All',
			resolveBtn: 'Resolve', dismissBtn: 'Dismiss', reportedBy: 'Reported by', noReports: 'No reports.'
		},
		users: {
			title: 'Users', searchPlaceholder: 'Search...', searchBtn: 'Search',
			banBtn: 'Ban', unbanBtn: 'Unban', banned: 'Banned', banReason: 'Ban reason:'
		},
		challenges: { title: 'Challenges', total: 'total challenges', publishBtn: 'Publish', archiveBtn: 'Archive' },
		community: {
			title: 'Community review', subtitle: 'Challenges submitted by the community awaiting validation.',
			approveBtn: 'Approve', rejectBtn: 'Reject', rejectFeedback: 'Feedback for creator:',
			viewInstructions: 'View instructions', by: 'by', empty: 'No challenges awaiting review.'
		},
		audit: {
			title: 'Audit log', date: 'Date', admin: 'Admin', action: 'Action', target: 'Target',
			details: 'Details', empty: 'No actions recorded.'
		}
	},
	community: {
		title: 'Community challenges', subtitle: 'Created by the community, voted by talents.',
		myChallenges: 'My challenges', createBtn: 'Create',
		empty: 'No community challenges yet. Be the first!',
		emptyFirst: 'You haven\'t created a challenge yet.',
		create: {
			title: 'Create a challenge',
			subtitle: 'Propose a challenge to the community. It will be reviewed by the team before publication.',
			challengeTitle: 'Title', description: 'Description', instructions: 'Instructions',
			instructionsPlaceholder: 'Detailed challenge instructions...',
			domain: 'Domain', difficulty: 'Difficulty', language: 'Language', duration: 'Duration (minutes)',
			durationPlaceholder: 'No limit', expectedOutput: 'Expected output',
			expectedOutputPlaceholder: 'Optional — the output the code should produce',
			submitForReview: 'Submit directly for review',
			submitForReviewHint: 'otherwise saved as draft',
			submitBtn: 'Submit for review', saveDraft: 'Save draft',
			creating: 'Creating...', submitted: 'Challenge submitted for review!', draftSaved: 'Draft saved.'
		},
		mine: {
			title: 'My challenges', empty: 'You haven\'t created a challenge yet.', createFirst: 'Create my first',
			status: { draft: 'Draft', review: 'In review', approved: 'Approved', rejected: 'Rejected' }
		}
	},
	errors: {
		notFound: 'Page not found',
		notFoundMessage: 'This page doesn\'t exist or has been moved.',
		forbidden: 'Access denied',
		forbiddenMessage: 'You don\'t have permission to access this page.',
		genericTitle: 'Something went wrong',
		genericMessage: 'An unexpected error occurred.',
		backHome: 'Back to home',
		retryBtn: 'Retry',
		generic: 'An error occurred. Please try again.'
	},
	moderation: {
		buttonLabel: 'Moderate',
		reasonLabel: 'Reason',
		reasonRequired: 'A reason is required for this action.',
		reasonPlaceholder: 'Briefly explain the decision (visible in the audit log)',
		confirmDanger: 'Confirm',
		cancel: 'Cancel',
		durationHours: 'Duration',
		toast: {
			done: 'Moderation action recorded.',
			failed: 'Action failed. Check your permissions or try again.'
		},
		forum: {
			actionDelete: 'Delete post',
			actionMuteAuthor: 'Mute author',
			actionMarkSpam: 'Mark as spam',
			menuLabel: 'Moderation actions',
			menuOpen: 'Open moderation menu',
			confirmDeleteBody: 'The post is removed from public view. The author is notified.',
			confirmMuteBody: 'The author cannot post during the chosen duration. They stay logged in.',
			confirmSpamBody: 'The post is hidden and the author is flagged for audit.',
			muteDuration24: '24 hours',
			muteDuration72: '3 days',
			muteDuration168: '7 days'
		},
		community: {
			approveCta: 'Approve',
			rejectCta: 'Reject',
			confirmApproveTitle: 'Approve this challenge?',
			confirmApproveBody: 'The challenge becomes public and eligible for fragments.',
			confirmRejectTitle: 'Reject this challenge?',
			confirmRejectBody: 'The author receives your reason. They can submit a fixed version.'
		},
		plagiarism: {
			title: 'Plagiarism queue',
			subtitle: 'Deliverables flagged by the backend. Decide if the submission stays valid or is revoked.',
			queueEmpty: 'No deliverable to review.',
			scoreLabel: 'Plagiarism score',
			flaggedOn: 'Flagged {date}',
			viewDeliverable: 'View deliverable',
			markValidCta: 'Mark valid',
			revokeCta: 'Revoke',
			confirmValidTitle: 'Mark this deliverable as valid?',
			confirmValidBody: 'The plagiarism score is cleared and the author keeps their fragments.',
			confirmRevokeTitle: 'Revoke this deliverable?',
			confirmRevokeBody: 'Fragments are removed and the author loses the associated badge.',
			noAccess: 'This page is reserved to plagiarism_reviewer capability holders.'
		}
	},
	events: {
		title: 'Skilluv events',
		subtitle: 'Join a hackathon, a fest or a themed season. Every event you join earns a stamp in your collection.',
		active: 'Live',
		upcoming: 'Upcoming',
		ended: 'Ended',
		partner: 'Partner',
		empty: 'No active events yet. Check back soon.',
		loadError: 'Could not load events. Try again later.',
		joinCta: 'Join event',
		joinedCta: 'Already joined',
		alreadyJoined: 'You have joined this event.',
		backToList: 'Back to events',
		myEventsTitle: 'My events',
		myEventsEmpty: 'You have not joined any event yet.',
		startsOn: 'Starts {date}',
		endsOn: 'Ends {date}',
		stampEarned: 'Stamp earned'
	},
	privacyPage: {
		title: 'Privacy & data',
		subtitle: 'Control what we collect, what we send, and export your data whenever.',
		consents: {
			title: 'Consents',
			subtitle: 'Changeable anytime. Essentials (auth, security, billing) do not depend on these choices.',
			marketingLabel: 'Marketing communications',
			marketingHint: 'Emails about launches, updates, offers. Zero third-party commercial spam.',
			analyticsLabel: 'Product analytics',
			analyticsHint: 'Anonymous stats to understand how you use Skilluv and improve it.',
			saved: 'Consents saved.'
		},
		gdpr: {
			title: 'GDPR export',
			subtitle: 'Machine-readable dump of all your personal data, GDPR legal format.',
			requestCta: 'Request my export',
			pending: 'Export in progress…',
			ready: 'Export ready.',
			downloadCta: 'Download',
			failed: 'Export failed. Contact support.'
		},
		dataExport: {
			title: 'Product export',
			subtitle: 'Readable bundle: your portfolio, completed challenges, badges.',
			requestCta: 'Request my bundle'
		},
		delete: {
			title: 'Delete my account',
			subtitle: 'The account enters soft-delete for 30 days. After, everything is permanently erased.',
			requestCta: 'Delete',
			modalTitle: 'Confirm deletion',
			modalBody: 'Your account will be deactivated immediately and permanently erased in 30 days. You can undo it during that window by logging back in.',
			reasonLabel: 'Reason (optional)',
			cancelCta: 'Cancel',
			confirmCta: 'Confirm deletion',
			scheduled: 'Deletion scheduled for {date}.'
		}
	},
	seasons: {
		currentLabel: 'Current season',
		endsOn: 'Ends {date}',
		selectorLabel: 'Season',
		allTime: 'All-time'
	},
	push: {
		title: 'Browser notifications',
		category: 'Push',
		description: 'Get notified when a talent replies, a mentor accepts a session, your bounty is paid…',
		statusOn: 'On',
		statusOff: 'Off',
		statusBlocked: 'Blocked',
		enableBtn: 'Enable notifications',
		disableBtn: 'Turn off',
		unsupported: 'This browser does not support push notifications.',
		blockedHint: 'Notifications blocked by browser. Change site settings to re-enable.',
		toast: {
			enabled: 'Notifications enabled',
			disabled: 'Notifications disabled',
			permissionDenied: 'Permission denied',
			receivedFallback: 'New notification'
		}
	},
	teams: {
		marketplace: {
			title: 'Team marketplace',
			subtitle: 'Join an open slot on a team challenge. Skilluv matches you against your orientations and proven skills.',
			filters: {
				role: 'Role',
				skill: 'Skill',
				minDifficulty: 'Min difficulty',
				maxDifficulty: 'Max difficulty',
				anyRole: 'Any role',
				anySkill: 'Any skill',
				anyDifficulty: 'Any',
				apply: 'Filter',
				reset: 'Reset'
			},
			empty: {
				title: 'No open slots.',
				body: 'Come back later or adjust your filters.',
				noFilters: 'No team is looking for talent right now.'
			},
			loadError: 'Could not load the marketplace. Try again later.',
			joinCta: 'Join',
			viewTeam: 'View team',
			pageInfo: 'Page {page} of {total}'
		},
		detail: {
			backToMarketplace: 'Back to marketplace',
			membersLabel: 'Members',
			slotsLabel: 'Slots',
			slotsEmpty: 'This team is full.',
			leaveCta: 'Leave slot',
			slotFilled: 'Filled',
			openSlots: 'Open slots',
			minLevel: 'Min level {n}',
			skillRequired: 'Skill required: {skill}',
			teamNotFound: 'Team not found.'
		},
		fillDialog: {
			title: 'Join this slot?',
			body: 'Once you join, you commit to delivering your part. You can leave until the challenge starts.',
			confirmCta: 'I join',
			cancelCta: 'Cancel',
			skillCheckLabel: 'Skill check',
			warnLowLevel: 'Your level on this skill is below the required minimum. You can still join — the team decides.'
		},
		leaveDialog: {
			title: 'Leave this slot?',
			body: 'Your slot will reopen and another talent can take it.',
			confirmCta: 'Leave'
		}
	},
	badges: {
		sections: {
			rank: 'Rank',
			patches: 'Proven skills',
			medals: 'Medals',
			crests: 'Guild crests',
			seal: 'Seal',
			sealsCount: 'challenge seals',
			stampsCount: 'event stamps',
			countersLabel: 'Seals and stamps'
		},
		rank: {
			achievedOn: 'Since {date}',
			previous: 'Formerly {previous}'
		},
		empty: {
			own: 'No badges yet. Finish your first challenge to earn one.',
			public: 'This person has no badges yet. Invite them to contribute.'
		}
	},
	orientations: {
		sectionTitle: 'Career orientations',
		primary: 'Primary',
		workingLanguages: 'Working languages',
		timezone: 'Timezone',
		selectionOrder: 'Selection number {n}',
		mode: {
			learning: 'Learning',
			active: 'Active'
		},
		empty: {
			own: 'No orientation selected. Your playlist will stay generic until you pick one.',
			public: 'No orientation set.'
		},
		selector: {
			title: 'Pick your orientations',
			subtitle: 'Select up to {max} orientations. Your playlist and community will follow.',
			filterLabel: 'Filter by domain',
			allDomains: 'All domains',
			emptyFilter: 'No orientation in this domain. Change the filter.',
			summary: 'Your selection',
			setPrimary: 'Primary',
			remove: 'Remove {name}',
			workingLanguagesLabel: 'Working languages',
			workingLanguagesHint: 'ISO codes separated by commas (e.g. en,fr,ar).',
			timezoneLabel: 'Timezone',
			timezoneHint: 'IANA format (e.g. Africa/Porto-Novo). Optional.',
			tooMany: 'Maximum {max} orientations. Remove one before adding another.',
			mustPickOne: 'Pick at least one orientation.',
			submit: 'Save my orientations'
		},
		banner: {
			title: 'Pick your career orientations',
			subtitle: 'Your Skilluv playlist and recommendations stay generic until you do.',
			cta: 'Pick now'
		},
		softBlock: {
			title: 'This section needs your orientations',
			defaultReason: 'Skilluv tailors this page to the career orientations you pick. Takes 30 seconds.',
			ctaPrimary: 'Pick now',
			ctaLater: 'Later'
		},
		catalog: {
			title: 'Your Skilluv path',
			subtitle: 'Pick 1 to 3 orientations. Skilluv will build your playlist, team slots and badges around them.',
			loadError: 'Could not load the orientation catalog. Try again later.',
			savedTitle: 'Orientations saved.',
			savedSubtitle: 'Your personalized playlist is ready on your dashboard.',
			continueCta: 'Continue to dashboard'
		},
		detail: {
			backToCatalog: 'Back to catalog',
			primaryDomain: 'Primary domain',
			secondaryDomains: 'Secondary domains',
			tags: 'Key skills',
			playlistTitle: 'Playlist preview',
			playlistSubtitle: 'The first 5 items Skilluv would suggest if you pick this orientation.',
			playlistEmpty: 'Personalized playlist unlocks once you pick this orientation.',
			pickCta: 'Add to my selection'
		}
	},
	capabilities: {
		sectionOwnTitle: 'How I contribute',
		sectionOwnSubtitle: 'Your active roles on Skilluv. You can mentor, curate, moderate depending on what you\'ve earned.',
		sectionPublicTitle: 'How this person contributes',
		sectionPublicSubtitle: 'Active roles on Skilluv, earned through proofs.',
		empty: 'No active roles yet. Keep contributing, they\'ll come.',
		expiresOn: 'Expires on {date}',
		grantedOn: 'Granted on {date}',
		items: {
			challenger: { label: 'Challenger', description: 'Solves published challenges and earns fragments.' },
			mentor: { label: 'Mentor', description: 'Runs 1-on-1 sessions with talents.' },
			project_steward: { label: 'Project steward', description: 'Coordinates a community project, arbitrates slots.' },
			pr_reviewer: { label: 'PR reviewer', description: 'Validates pull requests on open-source bounties.' },
			bounty_funder: { label: 'Bounty funder', description: 'Sponsors GitHub issues for the community.' },
			issue_proposer: { label: 'Issue proposer', description: 'Suggests issues to become bounties.' },
			jury_tournament: { label: 'Tournament jury', description: 'Grades submissions during a tournament.' },
			admin: { label: 'Administrator', description: 'Full platform access.' },
			enterprise_recruiter: { label: 'Enterprise recruiter', description: 'Talent sourcing for an enterprise account.' },
			community_moderator: { label: 'Community moderator', description: 'Moderates cross-cutting community spaces.' },
			forum_moderator: { label: 'Forum moderator', description: 'Removes spam and abuse on the forum.' },
			plagiarism_reviewer: { label: 'Plagiarism reviewer', description: 'Decides validity of flagged deliverables.' },
			kyc_reviewer: { label: 'KYC reviewer', description: 'Validates identity documents for payouts.' },
			community_curator: { label: 'Community curator', description: 'Approves or rejects community challenges under review.' }
		},
		nav: {
			forumModeration: 'Forum moderation',
			pendingCurator: 'Curator queue',
			plagiarismQueue: 'Plagiarism review',
			mentorZone: 'Mentor zone',
			juryTournament: 'Tournament jury'
		}
	}
};
