import { designEn } from './design.en';
import { designWorkflowEn } from './design_workflow.en';
import { portfoliosEn } from './portfolios.en';
import { securityEn } from './security.en';
import { postMvpEn } from './postmvp.en';
import { consentEn } from './consent.en';
import type { Translations } from './types';

export const en: Translations = {
	...postMvpEn,
	...designEn,
	...designWorkflowEn,
	...securityEn,
	...portfoliosEn,
	...consentEn,
	common: {
		actions: {
			save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
			search: 'Search', retry: 'Retry', back: 'Back', next: 'Next',
			previous: 'Previous', submit: 'Submit', confirm: 'Confirm', close: 'Close',
			create: 'Create', loading: 'Loading...', sending: 'Sending...',
			loadMore: 'Load more'
		},
		nav: {
			home: 'Home', challenges: 'Challenges', leaderboards: 'Leaderboards',
			profile: 'Profile', settings: 'Settings', notifications: 'Notifications',
			login: 'Log in', register: 'Get started', logout: 'Log out', community: 'Community'
		},
		domains: { code: 'Code', design: 'Design', game: 'Game Dev', security: 'Cybersecurity', ai: 'Artificial intelligence', ops: 'Ops & Cloud', quality: 'Quality & testing', leadership: 'Leadership', audio: 'Audio', communication: 'Communication', education: 'Teaching', soft_skills: 'Communication & leadership' },
		titles: { apprenti: 'Apprentice', ranger: 'Ranger', artisan: 'Artisan', maitre: 'Master', doyen: 'Elder', legende: 'Legend' },
		difficulty: { 1: 'Beginner', 2: 'Easy', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' },
		tone: { serious: 'Serious', fun: 'Fun', educational: 'Educational' },
		time: { minutes: '{n} min', hours: '{n}h', noLimit: 'No limit', ago: 'ago' },
		fragments: 'fragments', streak: 'Streak', team: 'Team', votes: 'votes', page: 'Page'
	},
	launch: {
		eyebrow: 'Opening',
		date: '11 January 2027',
		badge: 'Beta opens 11 January 2027',
		countdown: 'in {n} days',
		soon: 'very soon',
		open: 'Now open',
		cta: 'Claim my seat',
		note: 'First full season in June 2027.'
	},
	commonExtra: {
		exampleLabel: 'Example',
	},
	board: {
		title: 'Others certify',
		titleAccent: 'what you learned.',
		subtitle: 'Skilluv certifies what you made.',
		rowThem: 'What they do',
		rowUs: 'What Skilluv does',
		bootcampsLabel: 'Bootcamps',
		bootcampsThem: 'Sell training to the learner, end with an in-house certificate',
		bootcampsUs: 'Free for the learner, ends with a public record of work made',
		practiceLabel: 'Practice platforms',
		practiceThem: 'Artificial problems, measure puzzle-solving',
		practiceUs: 'Real projects, measure the ability to ship alongside others',
		jobsLabel: 'Job boards',
		jobsThem: 'Index claims',
		jobsUs: 'Index evidence',
		freelanceLabel: 'Freelance marketplaces',
		freelanceThem: 'Sell available hours',
		freelanceUs: 'Build the skill first, then make it visible',
		offshoreLabel: 'Offshore staffing',
		offshoreThem: 'Place profiles and own the relationship',
		offshoreUs: 'Make talent independent and directly reachable',
		cta: 'Create my account',
		loadError: 'Leaderboard temporarily unavailable.'
	},
	openMissions: {
		title: 'Open assignments',
		titleAccent: 'Pick yours.',
		subtitle: 'Each one sits on software that runs, with its users and its requirements.',
		emptyTitle: 'The catalogue opens with the beta.',
		emptyBody: 'The first assignments land on 11 January 2027. Claim your seat now and you will hear the day they open.',
		emptyCta: 'Claim my seat',
		allCta: 'All assignments',
		reward: '+{n} fragments',
		minutes: '{n} min'
	},
	ranks: {
		title: 'Your rank,',
		titleAccent: 'you make it.',
		subtitle: 'Five tiers, from Apprentice to Elder. They are not unlocked: they are computed from what you actually shipped, and each one traces back to the piece that earned it.',
		apprentiMeaning: 'First gestures, closely guided.',
		rangerMeaning: 'You ship on your own, on scoped assignments.',
		artisanMeaning: 'You own a piece end to end.',
		maitreMeaning: 'You examine other people’s work.',
		doyenMeaning: 'You set the bar on your discipline.',
		note: 'Nothing is reserved for a rank. Assignments, reviews, credentials and visibility to companies are open to everyone from day one.'
	},
	otherLines: {
		title: 'Seven lines.',
		titleAccent: 'Talent pays for none of them.',
		subtitle: 'Reaching a talent is bought online, above. The rest is scoped with you: we talk, we quote, we contract.',
		talentTitle: 'Talent',
		talentBody: 'Search on proof, per-contact reach, shortlists we build for you, recruiting tournaments.',
		talentWho: 'Company',
		workTitle: 'Work',
		workBody: 'Bounties on your issues, scoped subcontracting, dedicated studios, per-discipline assignment marketplaces.',
		workWho: 'Company',
		brandTitle: 'Brand and events',
		brandBody: 'Branded challenges, hackathons, season sponsoring, campaigns across the community.',
		brandWho: 'Company',
		dataTitle: 'Data',
		dataBody: 'Talent Score API, licensing, sector reports, white-label. Under explicit talent consent.',
		dataWho: 'Company',
		ecosystemTitle: 'Ecosystem',
		ecosystemBody: 'Creator marketplace, reviewer certification, in-house academy for your teams.',
		ecosystemWho: 'Company and talent',
		consultTitle: 'Advisory',
		consultBody: 'An hour with a high-ranked expert, architecture review by a senior pool, a skills audit of a team.',
		consultWho: 'Company',
		financeTitle: 'Finance',
		financeBody: 'Advance on an assignment in progress, loans backed by the track record, insurance, a support fund.',
		financeWho: 'Talent',
		cta: 'Talk to us'
	},
	howItWorks: {
		title: 'How it works',
		subtitle: 'Four beats, from the first gesture to the proof.',
		step1Title: 'You pick a track',
		step1Body: 'Backend development, interface design, web pentesting, sound design. Defined routes, each with the skills it demands.',
		step2Title: 'You get assignments',
		step2Body: 'Graduated, from a first small gesture to full ownership. Each one sits on software that genuinely exists, with its users and its quality bar.',
		step3Title: 'You ship, it gets examined, you go again',
		step3Body: 'Every contribution goes before someone further along. They ask for rework and argue about your choices. The review exchanges are archived: they are part of the proof, as much as the outcome.',
		step4Title: 'Your proof accumulates',
		step4Body: 'Every validated deliverable feeds your public profile. Ranks are computed from what you actually made, and each one traces back to the piece that earned it.',
		freeTitle: 'And you never pay.',
		freeBody: 'Not for registration, not for assignments, not for reviews, not for credentials, not for visibility to companies.',
		gradationLabel: 'A sequence, not a standalone exercise',
		gradation1Scope: 'First gesture',
		gradation1Body: 'Fix a misleading error message.',
		gradation2Scope: 'Scoped contribution',
		gradation2Body: 'Add the test case that was missing, and make it pass.',
		gradation3Scope: 'Full ownership',
		gradation3Body: 'Carry a feature end to end, all the way through review.',
		trackHours: '{n} h estimated',
		reviewLabel: 'Review excerpt',
		reviewAsk: 'Rework the error handling here. What happens when the file is empty?',
		reviewReply: 'Fixed, and I added a test case for exactly that.',
		reviewOutcome: 'Validated after rework',
		profileLabel: 'Public profile'
	},
	disciplines: {
		sectionTitleLine1: 'Eleven disciplines',
		sectionTitleLine2: 'A hundred and twenty tracks.',
		sectionSubtitle: 'Every discipline has its tracks, its grounds and its ranks.',
		lead: 'All of them lead to the same place: proof of what you made.',
		code: { label: 'Code', desc: 'Backend, frontend, mobile, systems, embedded.' },
		design: { label: 'Design', desc: 'UI/UX, design systems, motion, illustration.' },
		security: { label: 'Cybersecurity', desc: 'Pentesting, red team, forensics, cryptography.' },
		game: { label: 'Games', desc: 'Programming, game design, art and animation.' },
		ai: { label: 'Artificial intelligence', desc: 'Data, machine learning, MLOps, agents and RAG.' },
		ops: { label: 'Ops & Cloud', desc: 'Cloud, CI/CD, containers, reliability.' },
		quality: { label: 'Quality', desc: 'Testing and automation, across all four grounds.' },
		leadership: { label: 'Leadership', desc: 'Product, tech lead, production, people, mentoring.' },
		audio: { label: 'Audio', desc: 'Composition, sound design, voice, music implementation.' },
		communication: { label: 'Communication', desc: 'Documentation, evangelism, content, translation.' },
		education: { label: 'Teaching', desc: 'Training, curriculum design, teaching how to code.' }
	},
	landing: {
		title: 'Prove what you can do.',
		titleAccent: 'For real.',
		subtitle: 'An open source platform where you learn by making. Everyone walks away with proof of what they shipped.',
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
			aiDesc: 'Data, machine learning, MLOps, agents and RAG...',
			opsDesc: 'Cloud, CI/CD, containers, reliability and observability...',
			softSkillsDesc: 'Technical writing, open source maintenance, mentoring...',
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
	mentions: {
		title: 'Mentions',
		subtitle: 'Every place you were cited.',
		empty: 'Nobody has cited you yet.',
		emptyHint: 'When someone writes @{username}, it shows up here.',
		markAllRead: 'Mark all as read',
		allRead: 'Everything marked as read.',
		loadError: 'Could not load your mentions.',
		retry: 'Try again',
		sources: {
			forum_post: 'Forum',
			comment: 'Comment',
			slice_diary: 'Slice diary',
			message: 'Message'
		}
	},
	settings: {
		title: 'Settings',
		notifications: {
			title: 'Notifications',
			subtitle: 'Choose how Skilluv keeps you informed.',
			channels: { inApp: 'In-app', push: 'Push', email: 'Email' },
			channelsHint:
				'In-app: the bell. Push: your phone buzzes. Email: your inbox.',
			fixed: 'Always sent',
			fixedHint:
				'Some notifications are about your money or your account. They go out regardless, and showing you a switch that does nothing would be a lie.',
			categories: {
				payments: 'Money',
				account: 'Account',
				mentorship: 'Mentorship',
				social: 'Social',
				guild: 'Guilds',
				learning: 'Progress',
				enterprise: 'Companies',
				digest: 'Digests',
				lifecycle: 'Product news',
				admin: 'Moderation'
			},
			saved: 'Preferences saved',
			savedPartial: 'Saved, but {count} change(s) were refused.',
			resetAll: 'Reset everything to defaults',
			resetDone: '{count} customisation(s) removed.',
			quiet: {
				title: 'Quiet hours',
				subtitle:
					'During this window your phone stays silent. The notification is still written: you find it in the bell.',
				start: 'From',
				end: 'Until',
				timezone: 'Time zone',
				timezoneDetected: 'Detected from your browser.',
				transactional:
					'A failed payout goes through anyway: better woken than told the next morning.',
				enable: 'Turn on quiet hours',
				clear: 'Turn off',
				saved: 'Quiet hours saved',
				cleared: 'Quiet hours turned off'
			}
		},
		emailPrefs: {
			title: 'Email preferences',
			subtitle: 'Choose which emails you receive.',
			digestWeekly: 'Weekly digest',
			digestWeeklyDesc: 'Your week of activity, once a week.',
			streakReminder: 'Streak reminder',
			streakReminderDesc: 'A nudge when your streak is about to break.',
			marketing: 'Product announcements',
			marketingDesc: 'News and announcements. Off by default.',
			transactional:
				'Essential emails (verification, password, security, payment receipts) are always sent.',
			saved: 'Preferences saved',
			loadError: 'Could not load your email preferences.'
		},
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
			bio: 'Bio', bioHint: 'Short description visible on your profile',
			subtitle: 'What others see of you on Skilluv.',
			domain: 'Primary domain',
			country: 'Country', city: 'City',
			saved: 'Profile updated.'
		},
		availability: {
			title: 'Availability',
			subtitle: 'Tell recruiters whether you are open to opportunities.',
			openLabel: 'Open to opportunities',
			openHint: 'Visible to subscribed companies.',
			lookingFor: 'What you are looking for',
			lookingForPh: 'e.g. Rust backend contract, 3 days a week',
			salaryMin: 'Expected min (EUR/year)',
			salaryMax: 'Expected max (EUR/year)',
			visibility: 'Salary visibility',
			visibilityPrivate: 'Private',
			visibilityRecruiters: 'Verified recruiters',
			visibilityPublic: 'Public',
			saved: 'Availability updated.'
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
	attestationVerify: {
		title: 'Attestation check',
		subtitle: 'What Skilluv recorded, and who can dispute it.',
		checking: 'Checking...',
		validTitle: 'Valid attestation',
		validBody: 'Skilluv issued this document and it has not been revoked.',
		revokedTitle: 'Revoked attestation',
		revokedBody: 'This document was issued and then withdrawn. It no longer stands.',
		revokedOn: 'Revoked {date}',
		revokeReason: 'Reason: {reason}',
		notFoundTitle: 'Unknown code',
		notFoundBody: 'No attestation carries this code. Check what you typed.',
		issuedOn: 'Issued {date}',
		expiresOn: 'Valid until {date}',
		expired: 'Expired',
		typeLabel: 'Type',
		issuerLabel: 'Issuer',
		issuerSkilluv: 'Skilluv',
		issuerOrg: 'Partner organisation',
		codeLabel: 'Verification code',
		copyCode: 'Copy the code',
		copiedToast: 'Code copied.',
		shareCta: 'Share the link',
		sharedToast: 'Link copied.',
		holderCta: 'See the profile',
		fallbackError: 'The check did not go through. Try again.',
		certificateTitle: 'The certificate',
		certificateAlt: 'Certificate for {title}',
		certificateDownload: 'Open the certificate'
	},
	disputes: {
		title: 'Disputes',
		subtitle: 'A frozen payment, and what each side says about it.',
		empty: 'No disputes',
		emptyBody: 'Nothing to contest, and nobody is contesting anything of yours.',
		decision: 'Decision',
		payerHint: 'Withdrawing releases the money to the recipient.',
		recipientHint: 'If you do not answer, an operator will decide.',
		contestedHint: 'An operator is reviewing it. You will both be told.',
		contestTitle: 'Contest',
		contestHint: 'Explain what happened. The payer and the operator will read this.',
		contestPlaceholder: 'What you delivered, and when.',
		status: {
			open: 'Open',
			contested: 'Contested',
			refunded: 'Refunded',
			released: 'Paid out',
			withdrawn: 'Withdrawn'
		},
		actions: {
			raise: 'Report a problem',
			concede: 'Refund',
			contest: 'Contest',
			withdraw: 'Withdraw'
		},
		done: {
			concede: 'Refunded.',
			contest: 'Your answer was sent.',
			withdraw: 'Dispute withdrawn, money released.'
		},
		subjects: {
			mentorship_session: 'Mentorship session',
			bounty_slice: 'Bounty',
			certification_purchase: 'Certification',
			credit_pack: 'Credit pack'
		},
		raiseTitle: 'Report a problem',
		raiseHint: 'The money is frozen until the recipient answers. Say what went wrong.',
		raisePlaceholder: 'The session never happened.',
		raised: 'Reported. The recipient has to answer.'
	},
	payments: {
		title: 'Pay',
		operator: 'Operator',
		phone: 'Phone number',
		phoneHint: 'The number that will receive the confirmation request.',
		inlineHint: 'You confirm on your phone. You never leave this page.',
		pay: 'Send the request',
		waiting: 'Request sent to your phone',
		waitingHint: 'Approve it on your phone. You can close this window: the payment goes through either way.',
		done: 'Payment confirmed.',
		background: 'Still waiting on your operator. We keep checking on our side and will let you know. Do not pay a second time.',
		failed: 'The payment did not go through. Nothing was charged.',
		noInline: 'No operator in your country supports paying without leaving the page.',
		otherMethod: 'Other payment method',
		closeWhileWaiting: 'Close'
	},
	wallet: {
		title: 'My wallet',
		subtitle: 'Cash out to euros (Stripe) or CFA francs (Mobile Money). Hash-chained history for audit.',
		balanceLabel: 'Balance',
		balanceFragments: '{n} fragments',
		balanceEur: '≈ €{n}',
		lastUpdated: 'Updated {date}',
		requestPayoutCta: 'Request payout',
		downloadStatement: 'CSV statement',
		historyTitle: 'History',
		historyEmpty: 'No transactions yet.',
		payoutsTitle: 'My payouts',
		payoutsEmpty: 'No payout requested.',
		loadError: 'Could not load the wallet. Try again later.',
		tx: {
			earn: 'Earn',
			payout: 'Payout',
			adjustment: 'Adjustment',
			entryHash: 'Entry hash'
		},
		payoutStatus: {
			pending: 'Pending',
			processing: 'Processing',
			paid: 'Paid',
			failed: 'Failed',
			cancelled: 'Cancelled'
		},
		payoutModal: {
			title: 'Request a payout',
			amountLabel: 'Amount ({currency})',
			amountHint: 'Available balance: {balance} {currency}',
			amountBelowMin: 'Minimum amount is {min}.',
			amountAboveBalance: 'Amount exceeds your available balance.',
			methodLabel: 'Payment method',
			methodStripeLabel: 'Stripe Connect (EUR)',
			methodStripeDesc: 'International bank transfer via your Stripe account. Verified KYC required.',
			methodMomoLabel: 'Mobile Money (XOF)',
			methodMomoDesc: 'Orange Money / MTN / Wave — verified Mobile Money number required.',
			stripe: {
				notConnected: 'Your Stripe account is not connected or verified yet.',
				connectCta: 'Connect Stripe',
				connectingLabel: 'Redirecting…',
				readyLabel: 'Stripe verified',
				accountLabel: 'Account {id}',
				countryLabel: 'Country (ISO 2)'
			},
			momo: {
				providerLabel: 'Operator',
				providerOrange: 'Orange Money',
				providerMtn: 'MTN Mobile Money',
				providerWave: 'Wave',
				numberLabel: 'Mobile Money number',
				numberHint: 'International format, e.g. +22990000000',
				numberRequired: 'Mobile Money number is required.',
				registerCta: 'Register number',
				verifiedLabel: 'Number verified'
			},
			submit: 'Confirm payout',
			cancel: 'Cancel',
			submitted: 'Payout request saved.'
		}
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
			actionHide: 'Hide post',
			actionUnhide: 'Restore post',
			actionLock: 'Lock thread',
			actionUnlock: 'Unlock thread',
			actionMuteAuthor: 'Mute author',
			menuLabel: 'Moderation actions',
			menuOpen: 'Open moderation menu',
			confirmHideBody: 'The post disappears from public view. Reversible via "Restore". Reason required (>= 8 chars).',
			confirmUnhideBody: 'The post becomes visible again.',
			confirmLockBody: 'No new comments can be added while the thread is locked.',
			confirmUnlockBody: 'The thread accepts comments again.',
			confirmMuteBody: 'The author cannot post during the chosen duration. Reason required (>= 8 chars).',
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
		vouchings: {
			title: 'Vouching queue',
			subtitle:
				'Who put their own rank behind whom. Breaking a vouching costs the voucher a rank for ninety days, so the cost is shown before the decision.',
			statuses: {
				live: 'Live',
				broken: 'Broken',
				expired: 'Expired'
			},
			queueEmpty: 'No vouching in this state.',
			flagged: 'Flagged',
			flaggedHint: 'The backed account carries a revoked deliverable or a multi-account suspicion.',
			voucherLabel: 'Voucher',
			vouchedLabel: 'Backed',
			rankAtStake: 'Rank {rank}',
			openedOn: 'Opened {date}',
			untilLabel: 'Until {date}',
			brokenOn: 'Broken {date}',
			breakReason: 'Reason: {reason}',
			breakCta: 'Break',
			confirmBreakTitle: 'Break this vouching?',
			confirmBreakBody:
				'The voucher loses a rank for ninety days if they staked one. The reason is written to the audit log and cannot be edited afterwards.',
			brokeWithPenalty: 'Vouching broken. {name} drops to {rank} until {date}.',
			brokeWithoutPenalty: 'Vouching broken. Nothing was staked, so no rank changed.',
			total: '{n} in this state',
			loadMore: 'Load more',
			noAccess: 'This page is reserved to community_moderator and plagiarism_reviewer capability holders.'
		},
		externalSignals: {
			title: 'External signals queue',
			subtitle:
				'Declared accounts waiting on a human confirmation. Verifying says the person owns the account — never that Skilluv attests to the work.',
			queueEmpty: 'No signal waiting.',
			declaredOn: 'Declared {date}',
			openLink: 'Open the link',
			verifyCta: 'Confirm ownership',
			rejectCta: 'Remove',
			confirmRejectTitle: 'Remove this signal?',
			confirmRejectBody:
				'The declaration is destroyed for good. The reason is written to the audit log, which is the only trace that will remain.',
			verifiedToast: 'Signal confirmed.',
			rejectedToast: 'Signal removed.',
			noAccess: 'This page is reserved to community_moderator and community_curator capability holders.'
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
	domainWizard: {
		titles: { ai: 'Getting you started in AI', security: 'Getting you started in security' },
		subtitles: {
			ai: 'Six questions. They sort what gets recommended to you — nothing here counts as a proof.',
			security:
				'A few questions. They sort what gets recommended to you — nothing here counts as a proof, and none of it grants any permission to test anything.'
		},
		notAClaim:
			'Declared, never a claim. Rank, badges and craft score read verified work, and none of these answers is one.',
		progressLabel: 'Progress',
		stepOf: 'Question {n} of {total}',
		pickUpTo: 'Up to {n}.',
		maxSelections: '{n} answers at most. Unpick one to add another.',
		back: 'Back',
		next: 'Next',
		skipQuestion: 'Skip this one',
		finish: 'Done',
		skipAll: 'Skip the whole thing',
		savedToast: 'Saved.',
		noQuestions: 'This domain asks nothing yet.',
		questions: {
			level: 'Where are you at?',
			weekly_hours: 'How much time a week?',
			goal: 'What are you here for?',
			compute: 'What can you actually run?',
			main_frameworks: 'What do you work in?',
			huggingface_username: 'Your HuggingFace username',
			preferred_families: 'Which trades interest you?'
		},
		hints: {
			compute:
				'This one decides what is worth showing you: recommending a seventy-billion-parameter fine-tune to somebody on free Colab wastes their week.',
			huggingface_username:
				'A link a reader can follow. Your models there are not imported — a model counts here when it arrives as work that was reviewed.',
			preferred_families: 'Sorting, not a commitment. You can work outside them.'
		},
		options: {
			level: {
				debutant: 'Starting out',
				apprentissage: 'Learning',
				practitioner: 'Practitioner',
				senior: 'Senior',
				researcher: 'Researcher'
			},
			weekly_hours: {
				lt3: 'Under 3h',
				'3_10': '3 to 10h',
				gt10: 'Over 10h',
				fulltime: 'Full time'
			},
			goal: {
				learning: 'Learning',
				portfolio: 'Building a portfolio',
				paid_missions: 'Paid work',
				academic_research: 'Academic research',
				startup: 'Founding something'
			},
			compute: {
				none: 'Free Colab or Kaggle',
				personal_gpu: 'A card of my own',
				cloud_small: 'Cloud, under $500 a month',
				cloud_large: 'Cloud, over $500 a month',
				enterprise: 'An employer’s cluster'
			},
			main_frameworks: {
				pytorch: 'PyTorch',
				jax: 'JAX',
				tensorflow: 'TensorFlow',
				candle: 'Candle',
				mlx: 'MLX',
				other: 'Something else'
			}
		}
	},
	marketplace: {
		title: 'Creators marketplace',
		subtitle:
			'Templates, boilerplates, kits and samples, made by people here. What you may do with each one is on the card, not buried in the description.',
		allDomains: 'All disciplines',
		empty: 'Nothing on sale',
		emptyBody: 'No published item under this filter yet.',
		notFound: 'This item does not exist, or is not published.',
		backToList: 'All items',
		draft: 'Draft',
		downloadsCount: '{n} downloads',
		commissionNotice:
			'Skilluv keeps {low}% under €{threshold} and {high}% above. Taking a payment, hosting files and handling a dispute cost about the same whatever the price — a flat rate would make small items cost more to process than they earn, and small items are what make a marketplace worth browsing.',
		creatorReceives: 'The creator receives {amount}',
		platformKeeps: 'Skilluv keeps {amount}',
		buyCta: 'Buy',
		signInToBuy: 'Sign in to buy',
		yourItem: 'Yours. You cannot buy your own item.',
		publishCta: 'Publish it',
		publishedToast: 'Published.',
		boughtToast: 'Bought.',
		purchasedTitle: 'Bought',
		tokenTerms: 'The link lives {hours} hours and can be redeemed {n} times.',
		redeemCta: 'Get the files',
		notFetchableYet:
			'These are storage names, not links yet — the download endpoint does not hand out fetchable URLs. Your purchase stands; ask us and we will send the files.',
		rateCta: 'Rate it',
		rateTitle: 'Rate this item',
		rateHint: 'You bought it, so your rating counts. One to five.',
		reviewLabel: 'A few words',
		reviewPlaceholder: 'What it was good for, and what it was not.',
		rateSubmit: 'Send',
		ratedToast: 'Thanks — rating recorded.',
		licenses: {
			personal_use: 'Personal use',
			commercial: 'Commercial use',
			extended_commercial: 'Extended commercial'
		}
	},
	aiDomain: {
		title: 'AI on Skilluv',
		onboardingCta: 'Set up my recommendations',
		subtitle:
			'What people here have actually published, and what is worth entering right now elsewhere. The assistant is a different thing and lives on its own page.',
		artifactsTitle: 'Published artefacts',
		artifactsHint:
			'Verified work only. A pending submission would answer the question this listing exists for in the wrong way.',
		artifactsEmpty: 'Nothing published yet',
		artifactsEmptyBody: 'No verified artefact under this filter.',
		allSubtypes: 'Everything',
		subtypes: {
			ml_model: 'Model',
			dataset: 'Dataset',
			llm_agent: 'Agent',
			data_pipeline: 'Pipeline',
			ai_service_api: 'Service',
			ai_research_paper: 'Paper'
		},
		openHub: 'On its hub',
		competitionsTitle: 'Worth entering',
		competitionsHint:
			'Competitions and leaderboards outside Skilluv, picked by a curator who says why this one and not the forty others.',
		competitionsEmpty: 'Nothing open right now.',
		closesIn: 'Closes in {n} days',
		rolling: 'Rolling'
	},
	projectCredits: {
		title: 'Credits on this project',
		verifyCta: 'Check it'
	},
	audioDelivery: {
		title: 'Audio delivery',
		empty: 'Nothing delivered yet.',
		roleLabel: 'Role of the file',
		roles: {
			master: 'Masters',
			stem: 'Stems',
			preview: 'Previews',
			project_archive: 'Project files',
			documentation: 'Documentation'
		},
		analysis: {
			pending: 'Not measured yet',
			running: 'Measuring',
			done: 'Nothing measurable on this file',
			skipped: 'Not measured',
			failed: 'Measurement failed'
		},
		analysisFailed: 'Measurement failed on this file',
		mono: 'mono',
		channels: '{n} channels',
		listenCta: 'Listen',
		linkExpires: 'This link expires shortly — reload the page to get another.',
		uploadCta: 'Add a file',
		uploadedToast: 'File stored. The measurements run on a sweep and are not there yet.'
	},
	audioSources: {
		title: 'Sources and licences',
		empty: 'No third-party source listed.',
		addCta: 'Add a source',
		declaredComplete: 'Declared complete on {date}',
		notDeclared:
			'Nobody has stated this list is complete. An empty list is not the same as an original piece — the attestation reads the statement, not the count.',
		completeCta: 'This list is complete',
		completedToast: 'Declaration recorded.',
		declaredToast: 'Source added. The completeness statement was cleared.',
		purchasedFrom: 'Bought from {name}',
		noCommercial: 'Commercial use not permitted',
		openSource: 'Open the source',
		attributionRequired: 'A Creative Commons licence needs its credit line, verbatim.',
		reopensNotice:
			'Adding a source after declaring the list complete clears that statement — it stopped being true.',
		formTitle: 'Declare a source',
		formKind: 'How you came by it',
		formName: 'What it is',
		formNamePlaceholder: 'Splice pack, field recording, sample library…',
		formUrl: 'Where it came from',
		formLicence: 'Licence identifier',
		formAttribution: 'Credit line',
		formAttributionPlaceholder: 'As it must appear, word for word.',
		formSubmit: 'Declare',
		kinds: {
			original: 'Original',
			public_domain: 'Public domain',
			creative_commons: 'Creative Commons',
			royalty_free: 'Royalty-free',
			licensed_commercial: 'Negotiated licence',
			third_party_work: 'Third-party work'
		}
	},
	castings: {
		title: 'Voice castings',
		subtitle:
			'Calls for a voice: a character, one line everybody records, a deadline. Blind by default — the names stay out until somebody is chosen.',
		detailTitle: 'Voice casting',
		languageFilter: 'Language',
		languagePlaceholder: 'fr-BE',
		languageHint: 'Exact match. An accent is part of the brief here.',
		filterCta: 'Filter',
		blindLabel: 'Blind',
		blindNotice:
			'Names are withheld until a voice is chosen. The numbers are stable on this page, so you can talk about “take three”.',
		maxSeconds: '{n}s max',
		closesToday: 'Closes today',
		closesIn: 'Closes in {n} days',
		deadline: 'Auditions until {date}',
		empty: 'No open casting',
		emptyBody: 'Nothing is taking auditions right now, in this language at least.',
		notFound: 'This casting does not exist.',
		backToList: 'All castings',
		briefTitle: 'The character',
		sampleLineTitle: 'The line',
		sampleLineHint: 'Everybody records this one, which is what makes the takes comparable.',
		takesTitle: 'Takes ({n})',
		noTakes: 'Nobody has auditioned yet.',
		noPlaybackNotice:
			'Takes are not playable here: an audition is stored behind a short-lived signed link that this listing does not carry.',
		auditionCta: 'Send a take',
		chooseCta: 'Choose this voice',
		notYours: 'Only whoever opened this casting can choose a voice.',
		selectedToast: 'Voice chosen. The names are now public.',
		auditionSentToast: 'Take sent.',
		formTitle: 'Send a take',
		formHint: 'Record the line and link the file. Anything publicly reachable works.',
		formUrl: 'Link to the take',
		formNotes: 'Notes',
		formNotesPlaceholder: 'What you went for, the choices you made.',
		formReplaceNotice: 'A second take replaces the first — you choose which one is heard.',
		formSubmit: 'Send',
		statuses: {
			open: 'Open',
			reviewing: 'Under review',
			selected: 'Voice chosen',
			cancelled: 'Cancelled'
		}
	},
	guides: {
		title: 'Guides and templates',
		subtitle:
			'How to start in a trade, what to install, and the documents the work asks you to write. One catalogue, every discipline.',
		allDomains: 'All disciplines',
		allKinds: 'Everything for contributors',
		kinds: {
			onboarding: 'Getting started',
			toolkit: 'Toolkit',
			writeup_template: 'Writeup template',
			brief_template: 'Brief template'
		},
		briefNotice:
			'A brief is written by whoever commissions the work, before it starts — these are for companies, not for contributors.',
		empty: 'No guide here yet',
		emptyBody: 'Nothing published for this filter. Try another discipline.',
		notFound: 'This guide does not exist, or is not published.',
		backToList: 'All guides',
		otherLocaleNotice:
			'Served in {locale}: this guide has not been translated into your language yet.'
	},
	opportunities: {
		title: 'What you are being asked',
		waiting: '{n} waiting on an answer from you.',
		nothingWaiting: 'Nothing is waiting on an answer.',
		empty: 'Nobody is asking anything yet',
		emptyWithPosting:
			'Your posting is live. Companies see it when they search for what you do.',
		emptyNoPosting:
			'Publish what you are looking for and companies can pitch to you instead of the other way round.',
		pitchesTitle: 'Companies pitching to you',
		pitchesHint:
			'They spent credits to write these. Opening one tells them it was read — nothing more.',
		opened: 'opened',
		interested: 'Interested',
		notInterested: 'Not interested',
		answeredToast: 'Answer sent.',
		declineTitle: 'Turn this one down',
		declineHint: 'A reason is optional. Ten pitches do not owe ten explanations.',
		declinePlaceholder: 'Not the right moment, wrong stack, salary too low…',
		declineSubmit: 'Turn it down',
		campaignsTitle: 'Campaigns you were shortlisted for',
		interviewsTitle: 'Interviews',
		pickASlot: 'Pick a time that suits you.',
		joinMeeting: 'Join the meeting',
		declineInterview: 'None of these work',
		slotConfirmedToast: 'Time confirmed.',
		declinedToast: 'Declined.',
		trialsTitle: 'Trial periods',
		trialsHint: 'Approved hours are owed to you. Pending ones are a claim nobody has looked at yet.',
		until: 'until {date}',
		approvedHours: '{n} h approved',
		pendingHours: '{n} h pending',
		openTrial: 'Open it',
		postingTitle: 'What you published',
		remoteOnly: 'remote only',
		notLookingFor: 'Not looking for: {text}',
		pitchesLeft: '{n} pitches left to companies this month.'
	},
	trialHours: {
		title: 'Days claimed',
		back: 'Back',
		approvedTotal: '{n} h approved',
		pendingTotal: '{n} h pending',
		empty: 'Nothing claimed yet.',
		approved: 'Approved',
		rejected: 'Refused',
		pending: 'Waiting',
		rejectionReason: 'Reason: {reason}',
		claimCta: 'Claim a day',
		claimTitle: 'Claim a day',
		claimSubmit: 'Claim it',
		claimedToast: 'Day claimed.',
		formDate: 'Day worked',
		formHours: 'Hours',
		formSummary: 'What you did',
		formSummaryPlaceholder: 'Concretely, and in a way somebody can check.',
		formSummaryHint: 'This is what the client approves against.'
	},
	dashboardHome: {
		title: 'Your dashboard',
		greeting: 'Hello, {name}',
		waitingOnYou: '{n} thing waiting on an answer from you.',
		nothingWaiting: 'Nothing is waiting on you.',
		invitationsTitle: 'Waiting on you',
		closesOn: 'closes {date}',
		invitedOn: 'invited {date}',
		openContest: 'Open the contest',
		nextTitle: 'Worth doing next',
		cachedNotice: 'Refreshed hourly',
		nextEmpty: 'Nothing to suggest yet',
		nextEmptyBody: 'Finish a challenge or two and this fills in.',
		suggestionsUnavailable: 'Suggestions need a discipline to work from.',
		pickAnOrientation: 'Pick a trade',
		difficulty: 'difficulty {n}',
		estimatedHours: '~{n}h',
		formats: { individual: 'Solo brief', contest: 'Contest' },
		partOfTitle: 'What you are part of',
		eventsTitle: 'Events',
		contribution: 'Contribution',
		mentoringTitle: 'Mentoring',
		asMentor: 'As mentor',
		asMentee: 'As mentee',
		periodEnds: 'Runs until {date}',
		notRenewing: 'not renewing',
		stewardshipsTitle: 'Projects you steward',
		since: 'since {date}',
		yoursTitle: 'Yours',
		shortcuts: {
			opportunities: 'Asked of you',
			bookmarks: 'Bookmarks',
			notes: 'Notes',
			goals: 'Goals',
			vouchings: 'Vouchings',
			slices: 'My challenges',
			teams: 'Teams'
		}
	},
	domainRecord: {
		titles: {
			code: 'Code record',
			quality: 'Quality record',
			ops: 'Ops record',
			leadership: 'Leadership record',
			security: 'Security record'
		},
		primary: 'main',
		until: 'until {date}',
		openReport: 'Report',
		targetDomainsTitle: 'What the work was aimed at',
		credentialsTitle: 'Certifications',
		credentialsHint:
			'Issued by somebody else. Listed apart from the attestations: one is a thing Skilluv stands behind, the other a thing Skilluv checked a link to.',
		code: {
			storedDiffers: 'The listings still sort on {n} — the hourly sweep has not caught up.',
			languagesTitle: 'Languages',
			packagesTitle: 'Published packages',
			readOn: 'read {date}',
			missionsTitle: 'Missions delivered',
			portfoliosTitle: 'Accounts elsewhere',
			portfolioVerified: 'ownership proved',
			portfolioDeclared: 'declared'
		},
		quality: {
			bugsTitle: 'Confirmed defects',
			bugsHint:
				'Only the ones whose fix shipped and was re-checked. The fix is linked; the reproduction is not, and deliberately.',
			severityUnreviewed: 'severity not reviewed',
			seeTheFix: 'See the fix',
			testRunsTitle: 'Verified test runs',
			testRunsHint: 'Checked by a reviewer. A green badge on your own repository is not one.',
			testCount: '{total} tests, {failed} failing'
		},
		ops: {
			objectivesTitle: 'Objectives held',
			objectivesHint: 'Each with the figure and where it came from, so you can go and check.',
			objectiveFigures: '{achieved}% against {target}% over {days} days',
			met: 'Met',
			missed: 'Missed',
			evidence: 'Source',
			incidentsTitle: 'Incidents',
			detect: 'detected in {v}',
			resolve: 'resolved in {v}',
			postmortem: 'post-mortem {date}',
			costTitle: 'Cost work',
			sloKept: 'objective still met',
			sloBroken: 'objective no longer met'
		},
		leadership: {
			artefactsTitle: 'Documents',
			adopted: 'Adopted',
			confidentialTitle: 'Confidential work',
			confidentialHint:
				'What kind, at what scale, in what industry — and never what or where. Said in the abstract because the rest is not ours to publish.',
			cohortsTitle: 'Cohorts led',
			cohortFigures: '{graduated} finished of {joined}',
			leftForWork: '· {n} left for a job',
			ledToEnd: 'Led to the end',
			retrosTitle: 'Retrospectives',
			retrosHint: 'And whether the action items actually landed.',
			retroFigures: '{resolved} of {total} actions resolved',
			followedThrough: 'Followed through'
		},
		security: {
			findingsTitle: 'Confirmed findings',
			findingsHint:
				'A finding still under embargo arrives without its title, and dated to the month: a title is half the disclosure and a precise day narrows the window.',
			underEmbargo: 'Title withheld until disclosure',
			writeup: 'Writeup',
			practiceTitle: 'Practice solved',
			credentialChecked: 'checked',
			credentialDeclared: 'declared',
			elsewhereTitle: 'Reputation elsewhere',
			figuresDeclared: 'figures declared'
		}
	},
	requests: {
		title: 'What you are being asked',
		subtitle: 'Everything waiting on an answer from you, in one place.',
		waitingCount: '{n} waiting on you',
		empty: 'Nothing is waiting on you.',
		emptyHint: 'Onboardings, placements, assessments and beta programmes show up here.',
		onboardingsTitle: 'Mentored onboardings',
		onboardingMonths: '{n}-month onboarding',
		onboardingConsent:
			'Your employer paid for this. That is not the same as your having agreed to it — accepting starts it and pays your mentor their share.',
		asJunior: 'You are the junior',
		asMentor: 'You are the mentor',
		since: 'Since {date}',
		placementsTitle: 'Placements',
		placementTerms: '{months} months, {guarantee}-month guarantee',
		placementConsent:
			'This commits months of your working life, and a guarantee period after it. Read the terms before you accept.',
		assessmentsTitle: 'Written about you',
		assessmentsHint:
			'A conclusion nobody can answer is a verdict. You can reply, and your reply travels with it.',
		replyOpenCta: 'Reply',
		replyCta: 'Send the reply',
		replySent: 'Reply recorded.',
		cancelCta: 'Cancel',
		betaTitle: 'Beta programmes recruiting',
		betaHint: 'Open to everybody, not addressed to you in particular.',
		betaWeeks: '{n} weeks',
		joinCta: 'Join',
		joined: 'You are in.',
		acceptCta: 'Accept',
		declineCta: 'Decline',
		accepted: 'Accepted.',
		declined: 'Declined.',
		unlistedNote:
			'Consultations and engagements can be answered but not listed: nothing tells this page which ones you were invited to, so their absence here is not a sign that nobody asked.',
		unlistedCta: 'Check your notifications'
	},

	advances: {
		title: 'Advances',
		subtitle: 'Money you have earned and not yet been paid, drawn early against a fee.',
		empty: 'No advance requested.',
		whereCta: 'See your missions',
		ofExpected: '{percent} of {total} expected',
		fee: 'Fee {amount} ({percent})'
	},

	dataConsent: {
		title: 'What your record may be used for',
		subtitle:
			'Each use is asked for separately, and the ones that earn money say so and say what your share is.',
		empty: 'Nothing is being asked of your record.',
		commercial: 'Earns money',
		on: 'Agreed',
		revenueShare: 'Your share: {percent}',
		agreeCta: 'Agree',
		withdrawCta: 'Withdraw',
		agreed: 'Agreed.',
		withdrawn: 'Withdrawn.'
	},

	creator: {
		title: 'Paid for your reach',
		subtitle: 'What brands are paying for right now, and exactly what each one pays.',
		empty: 'Nothing open at the moment.',
		emptyHint: 'Campaigns and ambassador programmes arrive in waves rather than steadily.',
		campaignsTitle: 'Launch campaigns',
		campaignsHint: 'Paid per piece, out of a pot that runs out. Check what is left before you write.',
		perPiece: '{amount} per piece',
		pot: 'pot of {amount}',
		piecesLeftApprox: 'roughly {n} pieces left in it',
		until: 'until {date}',
		writeCta: 'Submit a piece',
		pieceTitlePlaceholder: 'Title of your piece',
		sendCta: 'Send it',
		cancelCta: 'Cancel',
		pieceSent: 'Piece submitted.',
		pieceSentWithPot: 'Piece submitted. About {n} more can still be paid from this pot.',
		ambassadorsTitle: 'Ambassador programmes',
		ambassadorsHint:
			'These are months, not a post: a monthly stipend against a monthly quota. Read the commitment before accepting.',
		perMonth: '{amount} a month',
		commitment: '{months} months, {n} deliverables a month',
		minimumRank: 'from rank {rank}',
		swag: 'swag included',
		previewAccess: 'early access to products',
		acceptCta: 'Accept',
		declineCta: 'Decline',
		joined: 'You are in.',
		declined: 'Declined.'
	},

	work: {
		title: 'Other ways to work',
		subtitle: 'Standing teams, living labs, and work somebody proposed before anyone commissioned it.',
		empty: 'Nothing open at the moment.',
		emptyHint: 'Studios form, labs open and proposals get published in waves rather than steadily.',
		studiosTitle: 'Studios',
		studiosHint: 'A standing team that sells days. You join people here, not a task.',
		dayRate: '{amount} a day',
		maxMembers: 'up to {n} members',
		labsTitle: 'Living labs',
		labsHint:
			'A company pays a community to keep using its product and report on it. The money is a monthly pool shared between contributors, so your share depends on who else joins.',
		monthlyPool: '{amount} a month, shared',
		communityTarget: '{n} contributors wanted',
		joinCta: 'Join',
		labJoined: 'You are in.',
		proposalsTitle: 'Proposals',
		proposalsHint:
			'This one runs backwards: somebody noticed a problem and is looking for the company, rather than a company arriving having already decided. It is not a job posting.',
		budgetEstimate: 'around {amount}',
		acceptCta: 'Accept',
		declineCta: 'Decline',
		proposalAccepted: 'Accepted.',
		proposalDeclined: 'Declined.'
	},

	quality: {
		title: 'Defects',
		subtitle: 'What you reported, what you can judge, and what the platform has published.',
		tabMine: 'Mine',
		tabQueue: 'To review',
		tabPublished: 'Published',
		queueHint:
			'You can review these because of the trade they belong to, not because of a role. The record says which trade decided.',
		empty: {
			mine: 'You have not reported a defect yet.',
			queue: 'Nothing waiting on your review.',
			published: 'No published report.'
		},
		emptyHint: 'A defect report carries steps, what you expected, and what happened instead.',
		wasFiledAs: 'filed as {severity}',
		seeTheFix: 'See the fix',
		fixConfirmed: 'Fix confirmed',
		fixUnconfirmed: 'Fix awaiting confirmation',
		confirmFixCta: 'Confirm the fix shipped',
		awaitingReview: 'awaiting review',
		acceptCta: 'Accept',
		regradeTo: 'Accept as {severity}',
		reviewed: 'Reviewed.',
		testRunsLiveOnSlices:
			'Test runs are read on the slice they ran against, next to the work they are evidence about.'
	},

	testRuns: {
		title: 'Test runs',
		verified: 'Verified',
		unverified: 'Not verified',
		verifyCta: 'Verify these figures',
		counts: '{total} tests, {failed} failed, {skipped} skipped',
		figuresFrom: 'figures from {source}',
		openReport: 'Open the report'
	},

	ops: {
		title: 'Operations',
		subtitle: 'Service objectives you committed to, incidents you ran, and what they cost.',
		empty: 'Nothing recorded yet.',
		emptyHint: 'An objective belongs to a slice or a project — a target on its own promises nothing.',
		objectivesTitle: 'Service objectives',
		objectivesHint: 'A promise made in advance and judged after its window closes.',
		targetOver: '{target}% over {days} days',
		running: 'Running',
		met: 'Met',
		missed: 'Missed',
		verified: 'Verified',
		selfReported: 'closed by its owner, not yet checked',
		observedOutside: 'observed from outside',
		evidence: 'Evidence',
		incidentsTitle: 'Incidents',
		incidentsHint: 'What is worth reading is the postmortem and what was done after, not the outage.',
		ongoing: 'Ongoing',
		minutes: '{n} min',
		timeToDetect: 'detected in {d}',
		timeToResolve: 'resolved in {d}',
		postmortemPublished: 'Postmortem published',
		postmortemMissing: 'No postmortem yet',
		costWorkNote:
			'Cost work is recorded against the slice or project it changed, and the saving is only attested once the service is verified to still meet its objective.'
	},

	game: {
		title: 'Game',
		subtitle: 'The creators put forward this week, and the mods you have registered.',
		empty: 'Nothing here yet.',
		emptyHint: 'Featured creators are picked weekly, and mods appear once you register one.',
		featuredTitle: 'Creators of the week',
		weekOf: 'Week of {date}',
		projectsHighlighted: '{n} projects highlighted',
		modsTitle: 'Your mods',
		modsHint:
			'A mod lives where its game’s community already is. Skilluv records that it exists rather than hosting a copy, and the download figure is the one you read on that host.',
		noMods: 'No mod registered.',
		registerCta: 'Register a mod',
		modTitlePlaceholder: 'Name of your mod',
		targetGamePlaceholder: 'Which game',
		targetPlatformPlaceholder: 'Which platform',
		modDescriptionPlaceholder: 'What it changes',
		saveCta: 'Register it',
		cancelCta: 'Cancel',
		modRegistered: 'Mod registered.',
		openOnHost: 'Open where it is hosted',
		declaredDownloads: '{n} downloads, declared',
		whereTheRestIs:
			'Playtests and the validation gate are on the slice they judge. A jam is read on its tournament. A project’s composition is on the project.'
	},

	playtest: {
		title: 'Playtests',
		gateReading: '{n} playtests, {avg}/5 on fun',
		gateMet: 'Meets the gate',
		gateNotYet: 'Not through the gate yet',
		fun: 'fun {n}/5',
		clarity: 'clarity {n}/5',
		minutes: '{n} min played',
		wouldPlayAgain: 'Would play again',
		wouldPlayAgainLabel: 'I would play it again',
		funLabel: 'Fun',
		clarityLabel: 'Clarity',
		difficultyLabel: 'Difficulty',
		difficulty: {
			too_easy: 'Too easy',
			just_right: 'About right',
			too_hard: 'Too hard'
		},
		bugsPlaceholder: 'Anything broken? (optional)',
		suggestionsPlaceholder: 'Anything you would change? (optional)',
		openCta: 'Record a playtest',
		sendCta: 'Send it',
		cancelCta: 'Cancel',
		recorded: 'Playtest recorded.'
	},

	leadership: {
		title: 'Retrospectives',
		subtitle: 'What you facilitated, and what actually came of it.',
		empty: 'No retrospective recorded.',
		emptyHint: 'A retrospective is evidence of leadership only once its actions are resolved.',
		participants: '{n} people',
		shared: 'Shared with the room',
		notShared: 'Not shared back yet',
		showActions: 'Actions',
		hideActions: 'Hide actions',
		noActions: 'No action recorded. Without them this was a meeting.',
		done: 'Done',
		late: 'Late',
		abandonedBecause: 'dropped — {reason}',
		markDoneCta: 'Mark done',
		newActionPlaceholder: 'What is to be done',
		addActionCta: 'Add',
		actionAdded: 'Action added.',
		actionDone: 'Action closed.',
		actionAbandoned: 'Action dropped.',
		whereTheRestIs:
			'Redaction, reach and cohorts are addressed by a slice or a cohort, so they are on those pages.'
	},

	leadershipArtefact: {
		title: 'Redaction and reach',
		acknowledged: 'Agreed {date}',
		pending: 'Not agreed yet',
		acknowledgeCta: 'My project agreed to this',
		acknowledgedToast: 'Acknowledged.',
		declareCta: 'Declare it anonymised',
		declaredToast: 'Declared. A reviewer confirms next.',
		confirmCta: 'Confirm the anonymisation',
		confirmedToast: 'Confirmed.',
		adoptionCta: 'Record an adoption',
		adoptionToast: 'Adoption recorded.',
		redactionNote:
			'Anonymising takes two people: the author declares it, somebody else reads it and confirms they recognised nobody.'
	},

	cohortOutcomes: {
		title: 'Outcomes',
		nothingRecorded: 'No outcome recorded yet — which is not the same as nobody finishing.',
		pickMember: 'Pick a member',
		pickReason: 'Why they left',
		reasons: {},
		graduateCta: 'Graduate',
		graduated: 'Graduated.',
		departureCta: 'Record a departure',
		departureRecorded: 'Departure recorded.',
		departureNote:
			'A cohort that only records graduations reports a hundred per cent forever. Leaving for a job is not dropping out, which is why the reason is asked for.',
		leadCta: 'Take the lead',
		ledToast: 'Recorded.',
		concludeCta: 'Conclude the cohort',
		concludedToast: 'Cohort concluded.'
	},

	projects: {
		title: 'Projects',
		subtitle: 'What Skilluv stands behind, what is asking for help, and what matches your record.',
		tabCurated: 'Curated',
		tabLooking: 'Wants help',
		tabRecommended: 'For you',
		hint: {
			curated: 'Skilluv put its name behind these. It is not something a project can apply to itself.',
			looking: 'These say so themselves — a flag their own owner set.',
			recommended: 'Matched against your verified work, and each one says what earned the match.'
		},
		empty: {
			curated: 'No curated project yet.',
			looking: 'Nobody is asking for help right now.',
			recommended: 'Nothing matches your record yet.'
		},
		curatedBadge: 'Curated',
		lookingBadge: 'Wants contributors',
		oss: 'open source',
		repo: 'Repository',
		starCta: 'Follow this project',
		starred: 'Following.',
		unstarred: 'No longer following.',
		matchedBecause: 'Matched on {domains} — {n} verified contributions there.',
		interestIsNotMembership:
			'Following a project tells you about it. It does not put you on it — only its owner adds contributors.'
	},

	ats: {
		title: 'Applicant tracker',
		subtitle: 'Your openings and their pipelines. Nobody outside your company can read them.',
		plansTitle: 'Plans',
		currentPlan: 'You are on {plan}.',
		noPlan: 'No plan chosen yet — including the free one, which is claimed like any other.',
		currentBadge: 'Current',
		chooseCta: 'Choose',
		subscribed: 'Plan claimed.',
		unlimited: 'unlimited',
		maxOpenings: '{n} open positions',
		maxCandidates: '{n} candidates per opening',
		retention: 'Rows kept {n} days',
		openingsTitle: 'Openings',
		noOpenings: 'No opening yet.',
		noOpeningsHint: 'An opening is where a pipeline hangs.',
		liveTitle: 'Open',
		closedTitle: 'Closed',
		positions: '{n} positions',
		remoteOk: 'remote welcome',
		closeCta: 'Close it',
		closed: 'Opening closed.',
		scopeNote:
			'Everything here belongs to your company. Skilluv stores it and does not read it: there is no admin view of your pipeline and no cross-company listing.'
	},

	linkedAccounts: {
		title: 'Linked accounts',
		subtitle: 'The identity providers you can sign in with.',
		none: 'No provider linked.',
		linkedOn: 'linked {date}',
		linkCta: 'Link {provider}',
		unlinkCta: 'Unlink',
		unlinked: 'Provider unlinked.',
		lastOne: 'Your only way in',
		discordHint:
			'Linking Discord opens the channels for your trades and grants your roles automatically. It is not a way to sign in.',
		discordUnlinkWarning:
			'Unlinking Discord takes your server roles back. You can link the account again at any time.',
		lastOneNote:
			'This is the only provider on the account, so unlinking it is not offered — it could leave you unable to sign in.'
	},

	discordLink: {
		title: 'Join your channels on Discord',
		body: 'Your trades are saved. Link your Discord account and your roles arrive within seconds, along with the channels that come with them — a direct message names them for you.',
		cta: 'Connect Discord',
		laterNote: 'You can do this later from your settings; nothing here depends on it.'
	},

	cv: {
		title: 'Your own account of yourself',
		subtitle: 'Where you worked, where you studied, what you speak.',
		declaredNote:
			'Nothing on this page is verified, and none of it feeds a rank, a score or a search result. That is what attestations are for — and it is precisely because this part is visibly declared that the rest of your profile is worth something.',
		experiencesTitle: 'Work',
		educationsTitle: 'Education',
		languagesTitle: 'Languages',
		addCta: 'Add',
		saveCta: 'Save',
		removeCta: 'Remove',
		removed: 'Removed.',
		current: 'Current',
		present: 'present',
		leaveEndEmpty: 'Leave the end date empty if you are still there.',
		companyPlaceholder: 'Company',
		titlePlaceholder: 'Your title',
		schoolPlaceholder: 'School',
		degreePlaceholder: 'Degree (optional)',
		setLanguageCta: 'Set',
		experienceAdded: 'Experience added.',
		educationAdded: 'Education added.',
		languageSet: 'Language set.'
	},

	reviewQueue: {
		title: 'Waiting on you',
		subtitle: 'Work that needs a verdict, and beginners waiting to be told theirs counts.',
		empty: 'Nothing is waiting on you.',
		emptyHint: 'Tasks appear here when they match what you can review.',
		tasksTitle: 'Review tasks',
		seniority: 'needs {level}',
		claimCta: 'Take it',
		claimed: 'Taken.',
		minutesLeft: 'yours for {n} min',
		hoursLeft: 'yours for {n}h',
		pastSla: 'Somebody has been waiting past what we promised them.',
		verificationsTitle: 'Beginner verifications',
		verificationsHint:
			'Not a test of skill. Somebody is explaining their own submission, which is the one thing a person who copied it cannot do — so this is what lets their work count.'
	},

	explore: {
		title: 'What is on Skilluv',
		subtitle: 'Everything happening right now — and, once you have a record, what matches it.',
		empty: 'Nothing to show yet.',
		emptyHint: 'Challenges, projects and events appear here as they open.',
		sponsoredTitle: 'Sponsored',
		sponsoredHint: 'A company paid for these to be here. We would rather say so than not.',
		sponsoredBadge: 'Sponsored',
		forYouTitle: 'Matched to you',
		forYouHint: 'Read from your verified work, so it fills up as you do things.',
		shelves: {}
	},

	codeDiscovery: {
		title: 'Start with code',
		subtitle: 'Issues to cut your teeth on, and what people here actually ship in.',
		firstIssuesTitle: 'First issues',
		firstIssuesHint:
			'The one list here that assumes nothing about you. No record needed, and it is never sorted by anybody’s standing.',
		languagePlaceholder: 'Language',
		filterCta: 'Filter',
		noIssues: 'No issue matches.',
		noIssuesHint: 'Try another language, or clear the filter.',
		openIssue: 'Open it',
		ecosystemsTitle: 'Ecosystems',
		topLanguagesTitle: 'Most shipped in',
		topLanguagesHint:
			'Counted from synced repositories — what people actually write, not what they say they write.'
	},

	contests: {
		title: 'Hiring contests',
		subtitle: 'A brief, a deadline, and a company reading what you hand in.',
		empty: 'No contest open.',
		emptyHint: 'They run in bursts rather than continuously.',
		acceptCta: 'Accept the invitation',
		declineCta: 'Decline',
		enterCta: 'Enter',
		submitCta: 'Hand it in',
		cancelCta: 'Cancel',
		notesPlaceholder: 'Anything the reader should know (optional)',
		accepted: 'Accepted.',
		declined: 'Declined.',
		submitted: 'Handed in.',
		enterpriseNote:
			'Judging, hires and outcomes are the company’s side and live in the enterprise console.'
	},

	deviceFeed: {
		devicesTitle: 'Devices',
		devicesSubtitle: 'The devices that can send you notifications.',
		noDevices: 'No device registered.',
		removeDeviceCta: 'Remove',
		deviceRemoved: 'Device removed.',
		feedTitle: 'Public feed',
		feedSubtitle: 'What the platform shows publicly about what you do.',
		withdrawCta: 'Take me out of the public feed',
		withdrawConfirm:
			'This removes you from the public feed entirely. It is not a preference — nothing you do will be published there.',
		withdrawConfirmCta: 'Take me out',
		withdrawn: 'You are out of the public feed.',
		cancelCta: 'Cancel'
	},

	evidence: {
		benchmarksTitle: 'Benchmarks',
		reproducedOn: 'reproduced {date}',
		notReproduced: 'Nobody has reproduced this',
		reproduceCta: 'I ran it too',
		reproducedToast: 'Recorded.',
		safetyTitle: 'Safety reports',
		safetyHint:
			'Publishing one the day it is found helps whoever wanted to use it, so each carries the date it becomes readable.',
		seenAgain: 'Seen by somebody else',
		sawItTooCta: 'I saw it too',
		disclosesOn: 'readable from {date}'
	},

	githubLink: {
		title: 'GitHub',
		subtitle: 'Synced repositories and the contribution figures read from them.',
		repoCount: '{n} repositories synced',
		connectCta: 'Connect GitHub',
		reconnectCta: 'Reconnect',
		syncCta: 'Sync now',
		synced: 'Synced.',
		cvCta: 'Open your generated CV',
		disconnectCta: 'Disconnect',
		disconnectNote:
			'Attestations already issued from this work stay. Disconnecting stops future syncing; it does not undo your record.',
		disconnectConfirmCta: 'Disconnect it',
		disconnected: 'Disconnected.',
		cancelCta: 'Cancel',
		syncNote:
			'Skilluv syncs when you ask rather than continuously — it reads your GitHub no more often than you want it to.'
	},

	declaredCraft: {
		portfoliosTitle: 'Code portfolios',
		portfoliosHint: 'npm, crates, PyPI — where you publish under your own name.',
		platformPlaceholder: 'npm',
		handlePlaceholder: 'your handle there',
		reviewLanguagesTitle: 'Languages you will review in',
		reviewLanguagesHint:
			'Nothing here tests your level, and a quiz would produce a number that looks like evidence. What this buys is accountability: it is signed, and every review you make under it carries it.',
		notePlaceholder: 'What your level actually covers (optional, and the useful part)',
		addCta: 'Add',
		removeCta: 'Remove',
		removed: 'Removed.',
		portfolioAdded: 'Portfolio added.',
		languageAdded: 'Language declared.'
	},

	mentoringProducts: {
		subscriptionsTitle: 'Your mentor subscriptions',
		usage: '{used} of {included} this month',
		cancelCta: 'Stop renewing',
		cancelled: 'Renewal stopped.',
		cancelNote:
			'Stopping the renewal does not end your access — you have paid for this period and you keep it.',
		slotsTitle: 'Your availability',
		slotsHint:
			'Offered in your own timezone, so a mentee somewhere else is not guessing what the hour meant.',
		openSlotCta: 'Open the slot',
		slotOpened: 'Slot opened.',
		programsTitle: 'Mentoring programmes',
		empty: 'No subscription or programme yet.'
	},

	educationOutcomes: {
		title: 'Teaching record',
		recorded: '{n} learner outcomes recorded',
		noneRecorded: 'No outcome recorded yet — which is not the same as nobody finishing.',
		adoptions: 'Run by {n} other trainers',
		clearedNote:
			'Teaching produces records about people who never joined Skilluv. Declaring the data cleared states on the record that you deleted them.',
		clearedCta: 'Declare learner data cleared',
		clearedConfirmCta: 'I deleted them',
		clearedDeclared: 'Recorded.',
		cancelCta: 'Cancel'
	},

	workAndSkills: {
		deliverablesTitle: 'What they shipped',
		openCta: 'Open',
		skillsTitle: 'Skills',
		skillsHint: 'Counted from verified work, not from anything typed on a form.'
	},

	programmaticPlans: {
		apiTitle: 'Talent Score API',
		apiSubtitle: 'Read scores by programme, under a licence with terms.',
		monthlyQuota: '{n} calls a month',
		dailyCeiling: '{n} a day',
		attributionRequired: 'Attribution required',
		sla: 'SLA',
		unlimited: 'Unlimited',
		learningTitle: 'Corporate learning',
		learningSubtitle: 'Seats for a team, billed per seat.',
		perSeat: '{amount} per seat'
	},

	assistantJobs: {
		title: 'Longer work',
		subtitle: 'A code review or a set of recommendations. Both take a moment.',
		reviewCta: 'Review this repository',
		recommendCta: 'Recommend something',
		working: 'Working on it — this takes a moment rather than an instant.',
		gaveUp: 'No answer came back in time. Try again, or check the repository is reachable.',
		notAValidation:
			'This is not a validation and never becomes one. A human reviewer decides whether work counts.'
	},

	report: {
		cta: 'Report',
		title: 'Report this',
		reasonLabel: 'What is wrong',
		reasons: {
			harassment: 'Harassment or abuse',
			inappropriate: 'Inappropriate content',
			spam: 'Spam',
			cheating: 'Cheating',
			fake_profile: 'Fake profile',
			other: 'Something else'
		},
		detailsPlaceholder: 'Anything a moderator should know (optional)',
		whatHappensNext:
			'A moderator reads this. We will not tell you it has been removed, because that is their decision to make and not ours to promise.',
		sendCta: 'Send the report',
		cancelCta: 'Cancel',
		closeCta: 'Close',
		sent: 'Report sent.'
	},

	firstRun: {
		title: 'Say hello to Skilluv',
		subtitle: 'Five minutes to set up what the platform shows you first.',
		startCta: 'Start',
		started: 'Started.'
	},

	craftProfile: {
		titles: {
			ai: 'AI record',
			audio: 'Audio record',
			communication: 'Communication record',
			education: 'Teaching record'
		},
		craftScoreTitle: 'Craft score',
		tierLabel: 'Tier {name}',
		cappedNotice: 'Ceiling reached',
		nextTierAt: 'Next tier at {n}',
		breakdownTitle: 'What counted',
		tradesTitle: 'Trades with verified work',
		attestationsTitle: 'Attestations',
		verifyCta: 'Check it',
		highlightsTitle: 'Worth hearing first',
		highlightsHint:
			'Published work. Listening to a master goes through the slice it belongs to, on a link that expires.',
		openWork: 'Open',
		languagesTitle: 'Languages translated into',
		languagesHint:
			'Counted from validated translations, not from what someone said they speak. The languages they offer to review in are a separate, declared list.',
		readFirstTitle: 'Worth reading first',
		views: '{n} read',
		engagement: '{n} reactions',
		cohortsTitle: 'Cohorts led',
		learners: '{n} learners',
		completed: '{n} of {of} completed',
		noOutcomes: 'No outcome recorded',
		taughtTitle: 'Published teaching',
		adoptions: 'run by {n} other trainers',
		notAClaim:
			'A craft score counts verified work. It is not a claim about anything done elsewhere.'
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
		stampEarned: 'Stamp earned',
		counted: 'Contribution counted'
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
	notifTypes: {
		slice_claimed: 'You claimed the slice {title}. 7 days to deliver.',
		slice_fork_created: 'Your fork is ready: {url}',
		slice_pr_submitted: 'PR {url} recorded, waiting for CI',
		slice_pr_submitted_announced: 'Comment posted on your PR',
		slice_ci_green: 'Your PR passed CI, waiting for Skilluv validation',
		validation_picked_up_by_you: 'You picked up the validation of the PR by @{user}',
		validation_picked_up_by_other: 'Your PR is being reviewed by @{user}',
		slice_validated: 'Your PR was validated. Attestation generated. Fragments credited.',
		slice_rejected: 'Your PR was rejected by @{user}. Reason: {reason}',
		slice_merged_upstream: 'Your PR was merged into {repo}. Bonus of {n} fragments.',
		slice_pr_rejected_upstream: 'Your PR was closed upstream without merging. You can pick the slice up again or move on.',
		validator_application_status_changed: 'Your validator application ({domain}) was {status}',
		validator_invitation_received: 'Skilluv invites you to become a {domain} validator. Reason: {notes}',
		slice_upstream_closed: 'The upstream issue {url} was closed. Your claim was released.',
		maintainer_digest_confirmation_sent: 'Confirmation email sent',
		maintainer_digest_subscribed: 'Your digest subscription is confirmed',
		statusApproved: 'approved',
		statusRejected: 'rejected',
		groupedCount: '{n} notifications on this challenge',
		groupedEvents: '{n} times',
		actorsAndOthers: '{names} and {n} others',
		actorsLast: '{names} and {last}'
	},
	notifActions: {
		seeReasons: 'See reasons and reclaim',
		accept: 'Accept',
		decline: 'Decline',
		downloadPdf: 'Download PDF',
		shareBadge: 'Share my badge',
		seeInvitation: 'See details',
		declineConfirm: 'Decline this invitation? It cannot be taken back.',
		acceptedOutcome: 'Invitation accepted',
		declinedOutcome: 'Invitation declined'
	},
	guilds: {
		tabsLabel: 'Guild sections',
		tabComposition: 'Composition',
		tabWars: 'Wars',
		tabMembers: 'Members',
		tabApplications: 'Applications',
		tabInvitations: 'Invitations',
		manage: {
			applicationsEmpty: 'No pending application.',
			invitationsEmpty: 'No pending invitation.',
			accept: 'Accept',
			reject: 'Reject',
			revoke: 'Revoke',
			revokeConfirm: 'Revoke this invitation? The link stops working immediately.',
			applicationAccepted: 'Application accepted.',
			applicationRejected: 'Application rejected.',
			invitationRevoked: 'Invitation revoked.',
			linkInvitation: 'Link invitation',
			expiresOn: 'Expires on {date}'
		},
		roleOwner: 'Owner',
		roleOfficer: 'Officer',
		roleMember: 'Member',
		warsEmpty: 'No war yet.',
		membersEmpty: 'No member yet.',
		warStatus: {
			proposed: 'Proposed',
			accepted: 'Accepted',
			declined: 'Declined',
			concluded: 'Concluded'
		},
		create: {
			cta: 'Found a guild',
			title: 'Found a guild',
			subtitle: 'A guild cannot be founded alone.',
			rule: 'You need exactly 3 co-founders besides yourself. Pick them before you start: the backend rejects any other composition.',
			name: 'Name',
			namePlaceholder: 'The Northern Smiths',
			slug: 'Handle',
			slugHint: 'Lowercase letters, digits and dashes. Used as the address: /guilds/my-handle',
			tag: 'Tag',
			tagHint: '2 to 5 characters, shown next to member names.',
			description: 'Description',
			color: 'Banner colour',
			cofounders: 'Co-founders',
			cofoundersHint: 'Type a Skilluv username and confirm. Exactly 3 are required.',
			cofounderPlaceholder: 'username',
			addCofounder: 'Add',
			removeCofounder: 'Remove {username}',
			cofounderCount: '{n} / 3 co-founders',
			cofounderNotFound: 'No account with that username.',
			cofounderDuplicate: 'That account is already on the list.',
			cofounderSelf: 'You are already the founder, no need to add yourself.',
			cofounderFull: 'You already have 3 co-founders.',
			submit: 'Found the guild',
			needThree: 'Exactly 3 co-founders are required to found a guild.',
			created: 'Guild founded.'
		}
	},
	tracks: {
		title: 'Tracks',
		subtitle: 'Guided itineraries from the basics to a real contribution.',
		estimatedHours: '{n} h estimated',
		emptyTitle: 'No track available',
		emptyBody: 'Tracks are coming soon. Check back later.',
		enrollCta: 'Join this track',
		loginToEnroll: 'Sign in to join',
		enrolledBadge: 'Enrolled',
		completedBadge: 'Completed',
		inProgressBadge: 'In progress',
		enrolledToast: 'Enrolled in track',
		startedOn: 'Started on {date}',
		viewCta: 'View',
		browseCta: 'Browse catalogue',
		dashboardTitle: 'My tracks',
		dashboardSubtitle: 'The tracks you joined.',
		dashboardEmptyTitle: 'You have not joined any track',
		dashboardEmptyBody: 'Pick a track to structure your progress.'
	},
	teams: {
		dashboard: {
			title: 'My teams',
			subtitle: 'The teams you belong to on collective challenges.',
			findSlotCta: 'Find a slot',
			viewCta: 'View',
			memberCount: '{n} member(s)',
			capacity: 'max {max}',
			emptyTitle: 'You are not on any team yet',
			emptyBody: 'Join an open slot on the team marketplace to start a collective challenge.'
		},
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
			juryTournament: 'Tournament jury',
			vouchingQueue: 'Vouching queue',
			externalSignalQueue: 'External signals'
		}
	},
	p26: {
		verify: {
			seoTitleValid: 'Verified Skilluv attestation — {name}',
			seoTitleDefault: 'Skilluv attestation',
			seoDescValid: 'Skilluv attestation for {name}: a validated contribution.',
			seoDescDefault: 'Verify a Skilluv attestation.',
			fallbackError: 'Could not load this attestation.',
			errorTitle: 'Loading error',
			backHome: 'Back to skill-uv.com',
			notFoundTitle: 'Attestation not found',
			invalidBadge: 'invalid',
			verifiedTitle: 'Verified Skilluv attestation',
			verifiedBadge: 'verified',
			issuedOn: 'Issued on {date}',
			contributor: 'Contributor',
			validatedBy: 'Validated by',
			contribution: 'Contribution',
			difficultyBadge: 'difficulty {n}/5',
			mergedUpstream: 'Merged upstream',
			repoLabel: 'Repo:',
			viewPr: 'View the PR',
			downloadPdf: 'Download PDF',
			share: 'Share',
			attestationId: 'Attestation ID',
			reasonMalformed: 'This link does not match the format of a Skilluv attestation.',
			reasonUnknown: 'No attestation matches this hash. It may have been revoked or never existed.',
			copyToast: 'Link copied to clipboard',
			copyPrompt: 'Copy this link:'
		},
		forMaintainers: {
			seoTitle: 'Skilluv — Weekly digest for OSS maintainers',
			seoDesc: 'Get a weekly recap of Skilluv contributions to your open-source repos. Zero spam, one-click unsubscribe.',
			ogDesc: 'One weekly email, Skilluv contributions across your repos. Zero spam.',
			title: 'Your Skilluv contributors, recapped once a week',
			subtitle: 'A weekly digest, zero spam, one-click unsubscribe.',
			whatSkilluvTitle: 'What Skilluv does',
			whatSkilluvBullet1: 'Our community (Afro-francophone, self-taught, career switchers) contributes to external OSS projects.',
			whatSkilluvBullet2Prefix: 'On the issues you label with',
			whatSkilluvBullet2Suffix: '(or public ones like',
			whatSkilluvBullet3: 'We validate their work before merge — Skilluv validation is a quality pre-filter.',
			whatReceiveTitle: 'What you receive',
			whatReceiveBullet1: 'Weekly digest of Skilluv PRs on your repos (claims, PRs submitted, PRs validated).',
			whatReceiveBullet2: 'Zero spam: one email per week, with one-click unsubscribe.',
			whatReceiveBullet3: 'Privacy: your email is never shared.',
			badgeTitle: 'Our Skilluv badge',
			badgeNew: 'new',
			badgeDesc: 'Add this badge to your README to show your project welcomes Skilluv contributions.',
			badgeAlt: 'Skilluv validated badge',
			copyBtn: 'Copy',
			copyAria: 'Copy snippet',
			badgeMarkdownAria: 'Skilluv badge Markdown snippet, keyboard-scrollable',
			copyToast: 'Snippet copied',
			copyPrompt: 'Copy this snippet:',
			faqTitle: 'FAQ',
			faqQ1: 'How does Skilluv know which repos I work on?',
			faqA1: 'You list them at signup. You can update your list any time.',
			faqQ2: 'Can I subscribe without any Skilluv-labeled repo?',
			faqA2: 'Yes — the digest will stay empty until you add the skilluv-challenge label to your issues.',
			faqQ3: 'How do I unsubscribe?',
			faqA3: 'A link in every email, or the /maintainer-digest/unsubscribe/{token} URL received at signup.',
			formTitle: 'Subscribe',
			successTitle: 'Confirmation requested',
			successMessage: 'A confirmation email was sent to {email}. Click the link in the email to activate your subscription.',
			githubLabel: 'GitHub login',
			githubPh: 'e.g. torvalds',
			emailLabel: 'Email',
			emailPh: 'you@example.com',
			reposLabel: 'Repos',
			reposHint: 'Format: owner/name — comma-separated (max 50)',
			reposPh: 'skilluv/skilluv-backend, skilluv/skilluv-frontend',
			optInLabel: 'I agree to receive the weekly digest.',
			submitBtn: 'Get the weekly digest',
			errInvalidGithub: 'Invalid GitHub login.',
			errInvalidEmail: 'Invalid email.',
			errReposMin: 'Enter at least one repo in owner/name format.',
			errReposFormat: 'Invalid format for: {list}',
			errReposMax: 'Maximum 50 repos.',
			errOptIn: 'You must agree to receive the digest.',
			errGeneric: 'Something went wrong.'
		},
		maintainerDigest: {
			confirmSeoTitle: 'Confirm subscription — Skilluv',
			confirmLoading: 'Confirming...',
			confirmSuccessTitle: 'Subscription confirmed for {email}. Thanks!',
			confirmSuccessBody: 'You will receive your first weekly digest soon.',
			confirmBackHome: 'Back to home',
			confirmInvalidTitle: 'This confirmation link is invalid or expired.',
			confirmInvalidFallback: 'This confirmation link is invalid or expired.',
			confirmFailed: 'Confirmation failed.',
			confirmSubscribeAgain: 'Subscribe again',
			unsubSeoTitle: 'Unsubscribe — Skilluv',
			unsubLoading: 'Unsubscribing...',
			unsubSuccessTitle: 'Unsubscribed. We will no longer send you the digest.',
			unsubSuccessBody: 'You will no longer receive the weekly digest emails ({email}).',
			unsubInvalidTitle: 'This link is invalid.',
			unsubInvalidFallback: 'This link is invalid.',
			unsubFailed: 'Unsubscribe failed.',
			unsubBackHome: 'Back to home'
		},
		slice: {
			status: {
				open: 'Open',
				claimed: 'Claimed',
				in_progress: 'In progress',
				submitted: 'PR submitted',
				ci_green: 'CI green',
				pending_validation: 'Pending validation',
				validated: 'Validated',
				merged: 'Merged upstream',
				closed: 'Closed',
				expired: 'Expired'
			},
			rankGte: 'rank ≥ {rank}',
			difficultyBadge: 'difficulty {n}/5',
			daysLeft: '{n}d left',
			expired: 'Expired',
			issueGithub: 'GitHub issue',
			yourFork: 'Your fork',
			viewPr: 'View the PR',
			acceptanceTitle: 'Acceptance criteria',
			workflowTitle: 'Workflow',
			workflowInterrupted: 'Workflow interrupted ({status}).',
			rejectTitle: 'PR not validated',
			claimGateBlocked: 'Your rank or orientation does not match this slice yet.',
			claimBtn: 'Claim this challenge',
			loginToClaim: 'Log in to claim',
			submitPrTitle: 'Submit your PR',
			prUrlLabel: 'Pull request URL',
			prUrlPh: 'https://github.com/owner/repo/pull/123',
			announceLabel: 'Announce publicly on the PR that I contribute via Skilluv',
			announceHint: 'A comment will be posted on your PR under your name.',
			sendPrBtn: 'Send the PR',
			unclaimBtn: 'Unclaim',
			ciPending: 'Waiting for CI',
			ciGreen: 'CI green, awaiting validation',
			pendingReview: 'Under review',
			pendingReviewBy: 'by a Skilluv validator.',
			attestationGenerated: 'Attestation generated',
			mergedUpstream: 'Merged upstream',
			downloadAttestationPdf: 'Download the attestation PDF',
			verifyPublic: 'Verify publicly',
			attestationIdLabel: 'Attestation ID:',
			confirmRelease: 'Release this challenge?',
			toastReserved: 'Challenge claimed',
			toastReleased: 'Challenge released',
			toastPrSent: 'PR submitted',
			toastReserveError: 'Could not claim',
			toastReleaseError: 'Operation failed',
			toastSendError: 'Could not submit',
			widgets: {
				activeTitle: 'Active this week',
				activeEmpty: 'No Skilluver active recently.',
				activeCountSingular: '{n} active Skilluver',
				activeCountPlural: '{n} active Skilluvers',
				diaryTitle: 'Logbook',
				diaryTextareaPh: 'Where are you? Blockers, findings, next step...',
				diaryPublicLabel: 'Public (visible to everyone)',
				diaryPublishBtn: 'Publish',
				diaryEmpty: 'No entries yet.',
				diaryPublicBadge: 'Public',
				diaryPrivateBadge: 'Private',
				diaryToastPublished: 'Entry published',
				diaryToastError: 'Could not publish'
			}
		},
		dashboardSlices: {
			seoTitle: 'My challenges — Skilluv',
			title: 'My challenges',
			subtitle: 'Your contributions in progress, completed or archived.',
			tabActive: 'Active',
			tabDone: 'Completed',
			tabArchived: 'Archived',
			difficultyBadge: 'difficulty {n}/5',
			rankBadge: 'rank {rank}',
			viewBtn: 'View',
			claimBtn: 'Claim',
			detailBtn: 'Details',
			emptyActiveTitle: 'No challenge in progress',
			emptyActiveBody: 'Discover the challenges recommended for you below.',
			emptyActiveCta: 'View recommendations',
			emptyDoneTitle: 'No validated contribution yet',
			emptyArchivedTitle: 'Nothing here',
			recoTitle: 'Recommended for you',
			recoBasedOnRank: 'Based on your rank',
			recoMedian: 'and your recent challenges (median difficulty: {n}/5)',
			recoEmptyTitle: 'No recommendation for now',
			recoEmptyBody: 'Your rank and orientations determine which slices are proposed.',
			toastReserved: 'Challenge claimed',
			toastGateBlocked: 'Your rank or orientation does not match yet.',
			toastReserveError: 'Could not claim'
		},
		validation: {
			queueSeoTitle: 'Validation queue — Skilluv',
			queueTitle: 'Validation queue',
			queueSubtitle: 'PRs awaiting validation in your domains.',
			filterAll: 'All',
			filterMine: 'Picked up by me',
			notValidatorTitle: 'You are not a validator yet',
			notValidatorBody: 'To access the queue you must apply as a validator on at least one domain.',
			applyCta: 'Apply',
			retryBtn: 'Retry',
			emptyTitle: 'No PR to validate in your domains',
			emptyBody: 'Come back later — the queue fills up automatically.',
			difficultyBadge: 'difficulty {n}',
			viewPr: 'View the PR',
			reviewBtn: 'Review',
			pickupBtn: 'Pick up',
			toastPickedUp: 'Challenge picked up.',
			toastTakenByOther: 'Another validator has already picked up this challenge.',
			toastPickupError: 'Pick-up error.',
			toastLoadError: 'Could not load the queue.',
			reviewSeoTitle: 'Review a PR — Skilluv',
			backToQueue: 'Back to the queue',
			notFoundTitle: 'Not found',
			notFoundBody: 'This challenge is not in your validation queue. It may have already been handled.',
			reviewLoadError: 'Could not load the review.',
			statusBadge: 'status {status}',
			approvedTitle: 'Validation approved',
			approvedFragments: '{n} fragments credited. The attestation is public.',
			attestationIdLabel: 'Attestation ID: {hash}',
			downloadPdf: 'Download PDF',
			warningPublicApprove: 'By approving, you will generate an attestation publicly reachable at /verify/{hash} and downloadable as PDF. Fragments will be credited to the challenger and to you.',
			reviewPrTitle: 'Review the PR',
			reviewIframeHint: 'The iframe is blocked by GitHub — use this button to open the PR in a new tab.',
			openPrOnGithub: 'Open the PR on GitHub',
			verdictTitle: 'Your verdict',
			feedbackLabel: 'Feedback (required to reject, 1-2000 characters)',
			feedbackPh: 'Explain what works (or does not) in this PR.',
			feedbackCounter: '{n}/2000',
			rejectBtn: 'Reject',
			approveBtn: 'Approve',
			errClaimerSelf: 'Not allowed: you are the claimer of this PR.',
			errApprove: 'Error while approving.',
			errReject: 'Error while rejecting.',
			toastRejected: 'PR rejected.'
		},
		validatorApplication: {
			newSeoTitle: 'Become a validator — Skilluv',
			backToApplications: 'My applications',
			newTitle: 'Become a Skilluv validator',
			newSubtitle: 'Validators verify Skilluv PRs before they are marked as validated. Each validation credits you in fragments and boosts your reputation.',
			domainLabel: 'Domain',
			thresholdsTitle: 'Required thresholds',
			thresholdsUnavailable: 'Stats loading unavailable for now. You can apply — the backend will verify the criteria.',
			thresholdsLoading: 'Loading...',
			rankLine: 'Rank Artisan minimum',
			rankMiss: 'You are {rank}, Artisan required.',
			prsLine: '{n} validated PRs in {domain}',
			prsMiss: '{n} so far.',
			reposLine: '{n} repos covered',
			reposMiss: '{n} so far.',
			tenureLine: '{n} days of tenure',
			tenureMiss: '{n} days so far.',
			motivationLabel: 'Motivation (optional)',
			motivationPh: 'Why do you want to become a validator on this domain?',
			motivationCounter: '{n}/500',
			applyBtn: 'Apply',
			toastApplySuccess: 'Application sent.',
			toastApplyCriteria: 'A criterion is not met. Check the thresholds above.',
			toastApplyError: 'Error while sending.',
			listSeoTitle: 'My validator applications — Skilluv',
			listTitle: 'My validator applications',
			listNewBtn: 'New application',
			listFilterAll: 'All',
			listFilterPending: 'Pending',
			listFilterAccepted: 'Accepted',
			listFilterRejected: 'Rejected',
			listFilterWithdrawn: 'Withdrawn',
			statusPending: 'Pending',
			statusAccepted: 'Accepted',
			statusRejected: 'Rejected',
			statusWithdrawn: 'Withdrawn',
			originAdminInvite: 'Admin invitation',
			originApplication: 'Application',
			adminNote: 'Admin note',
			createdOn: 'Created on {date}',
			updatedOn: 'updated {date}',
			acceptInvitationBtn: 'Accept the invitation',
			viewDetailBtn: 'View details',
			withdrawBtn: 'Withdraw',
			listEmptyTitle: 'No application yet',
			listEmptyBody: 'Apply on a domain you master to join the validators team.',
			listApplyCta: 'Apply',
			listEmptyFilterTitle: 'No application in this filter.',
			listLoadError: 'Could not load.',
			toastWithdrawn: 'Application withdrawn.',
			toastAccepted: 'Invitation accepted.',
			toastError: 'Error.',
			inviteSeoTitle: 'Validator invitation — Skilluv',
			inviteBackLink: 'My applications',
			inviteNotFoundTitle: 'Not found',
			inviteNotFoundBody: 'This invitation does not exist or is no longer available.',
			inviteError: 'Error.',
			inviteTitle: 'Admin invitation — Become a {domain} validator',
			inviteBadge: 'Admin invitation',
			invitePendingBadge: 'Pending',
			inviteBody: 'A Skilluv admin is inviting you to join the {domain} validators team.',
			inviteReasonTitle: 'Reason for the invitation',
			inviteNoNote: 'The admin did not leave a note.',
			inviteReceivedOn: 'Received on {date}',
			inviteAcceptBtn: 'Accept',
			inviteDeclineBtn: 'Decline',
			toastInviteAccepted: 'Invitation accepted.',
			toastInviteDeclined: 'Invitation declined.'
		},
		badges: {
			ariaLabel: 'Skilluv badges',
			sectionLabel: 'Skilluv badges',
			personalTitle: 'Skilluv badge',
			personalDesc: 'Paste this badge on your GitHub profile, resume or LinkedIn to show your Skilluv community.',
			personalAlt: 'Skilluv badge {username}',
			notGenerated: 'Badge not yet generated',
			markdownLabel: 'Markdown',
			htmlLabel: 'HTML',
			copyBtn: 'Copy',
			reposTitle: 'Skilluv badges for your repos',
			reposDesc: 'Add these badges to your repo READMEs to show the active Skilluv community.',
			repoBadgeAlt: 'Skilluv badge {repo}',
			copyToastSuccess: 'Copied',
			copyToastError: 'Could not copy'
		}
	}
};
