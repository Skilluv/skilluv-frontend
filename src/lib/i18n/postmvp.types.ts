/**
 * Translation keys for the Post-MVP backlog tiers 1 to 3 (SKI-36 … SKI-47).
 *
 * Split out of `types.ts` and folded back in through `interface Translations
 * extends PostMvpTranslations`. Twelve features would have added a third to
 * the length of a file that is already hard to scan, and none of these keys
 * are referenced by the MVP surface.
 */
export interface PostMvpTranslations {
	/** T1-01 — polymorphic bookmarks. */
	bookmarks: {
		title: string;
		subtitle: string;
		emptyTitle: string;
		emptyBody: string;
		addCta: string;
		addedToast: string;
		removedToast: string;
		saveAria: string;
		removeAria: string;
		dialogTitle: string;
		folderLabel: string;
		folderPlaceholder: string;
		folderHint: string;
		noteLabel: string;
		notePlaceholder: string;
		allFolders: string;
		unfiled: string;
		filterType: string;
		filterAll: string;
		countLabel: string;
		openCta: string;
		targetTypes: {
			challenge_template: string;
			project: string;
			user: string;
			team: string;
			deliverable: string;
			slice: string;
		};
	};
	/** T1-02 — private notes on public artifacts. */
	notes: {
		title: string;
		subtitle: string;
		emptyTitle: string;
		emptyBody: string;
		editorTitle: string;
		placeholder: string;
		privateHint: string;
		save: string;
		savedToast: string;
		remove: string;
		removeConfirm: string;
		removedToast: string;
		charCount: string;
		emptyBodyError: string;
		lastEdited: string;
		openCta: string;
		writeCta: string;
		editCta: string;
	};
	/** T1-03 — personal tracked goals. */
	goals: {
		title: string;
		subtitle: string;
		newCta: string;
		emptyTitle: string;
		emptyBody: string;
		kinds: {
			rank: string;
			skill_level: string;
			capability: string;
			artifact_count: string;
		};
		kindHints: {
			rank: string;
			skill_level: string;
			capability: string;
			artifact_count: string;
		};
		formTitle: string;
		formKind: string;
		formTargetValue: string;
		formTargetSkill: string;
		formDeadline: string;
		formDeadlineHint: string;
		formSubmit: string;
		createdToast: string;
		updatedToast: string;
		deletedToast: string;
		progressLabel: string;
		achievedLabel: string;
		archivedLabel: string;
		showArchived: string;
		hideArchived: string;
		deadlineLabel: string;
		noDeadline: string;
		clearDeadline: string;
		etaDays: string;
		etaUnknown: string;
		criteriaTitle: string;
		criteriaProgress: string;
		criteria: {
			verified_deliverables: string;
			attestations: string;
			mentor_capability: string;
			proficiency_level: string;
			capability: string;
		};
		deleteCta: string;
		deleteConfirm: string;
	};
	/** T1-04 — the profile timeline. */
	timeline: {
		title: string;
		subtitle: string;
		ownSubtitle: string;
		emptyTitle: string;
		emptyBody: string;
		ownEmptyBody: string;
		filterLabel: string;
		filterAll: string;
		totalLabel: string;
		loadMore: string;
		events: {
			signup: string;
			orientation_added: string;
			deliverable_verified: string;
			rank_promoted: string;
			capability_granted: string;
			attestation_received: string;
			event_participation: string;
			first_bounty_earned: string;
			first_mentor_session: string;
		};
		eventFallback: string;
	};
	/** T2-01 — time-boxed study cohorts. */
	cohorts: {
		title: string;
		subtitle: string;
		newCta: string;
		browseCta: string;
		emptyTitle: string;
		emptyBody: string;
		upcomingOnly: string;
		filterOrientation: string;
		filterAll: string;
		seatsLeft: string;
		full: string;
		memberCount: string;
		runsFrom: string;
		notStarted: string;
		running: string;
		over: string;
		archived: string;
		privateLabel: string;
		join: string;
		joinedToast: string;
		leave: string;
		leaveConfirm: string;
		leftToast: string;
		aboutTitle: string;
		membersTitle: string;
		milestonesTitle: string;
		chatTitle: string;
		roleOrganizer: string;
		roleMember: string;
		milestonesEmpty: string;
		milestoneAdd: string;
		milestoneTitle: string;
		milestoneDescription: string;
		milestoneTargetDate: string;
		milestoneDue: string;
		milestoneDone: string;
		milestoneDelete: string;
		milestoneAddedToast: string;
		chatPlaceholder: string;
		chatSend: string;
		chatEmpty: string;
		chatMembersOnly: string;
		chatLoadOlder: string;
		formSlug: string;
		formSlugHint: string;
		formName: string;
		formDescription: string;
		formStartsAt: string;
		formEndsAt: string;
		formMaxMembers: string;
		formOrientation: string;
		formOrientationNone: string;
		formIsPublic: string;
		formIsPublicHint: string;
		formSubmit: string;
		createdToast: string;
		mineTitle: string;
		mineEmpty: string;
		vsTeams: string;
	};
	/** T2-02 — structured peer-to-peer coaching. */
	peerMatching: {
		title: string;
		subtitle: string;
		vsMentorship: string;
		enrollTitle: string;
		enrollOrientation: string;
		enrollCadence: string;
		enrollCadenceUnit: string;
		enrollSubmit: string;
		enrolledToast: string;
		enrollmentsTitle: string;
		enrollmentsEmpty: string;
		unenroll: string;
		unenrolledToast: string;
		proposalsTitle: string;
		proposalsEmpty: string;
		proposalsRefresh: string;
		proposalsPick: string;
		scoreLabel: string;
		sameRank: string;
		rankDistance: string;
		timezoneClose: string;
		timezoneUnknown: string;
		sharedLanguages: string;
		noSharedLanguages: string;
		matchedToast: string;
		matchesTitle: string;
		matchesEmpty: string;
		matchActive: string;
		matchEnded: string;
		matchEnd: string;
		matchEndConfirm: string;
		matchEndedToast: string;
		showEnded: string;
		sessionsTitle: string;
		sessionsEmpty: string;
		sessionSchedule: string;
		sessionScheduleCta: string;
		sessionScheduledToast: string;
		sessionUpcoming: string;
		sessionPast: string;
		sessionCanceled: string;
		sessionCancel: string;
		sessionCancelConfirm: string;
		checkInTitle: string;
		checkInNotes: string;
		checkInNotesPlaceholder: string;
		checkInRating: string;
		checkInSubmit: string;
		checkInSavedToast: string;
		checkInDone: string;
		yourNotes: string;
		peerNotes: string;
		peerNotesPending: string;
	};
	/** T2-03 — declared, never-counted external context. */
	externalSignals: {
		title: string;
		subtitle: string;
		disclaimer: string;
		profileTitle: string;
		profileHint: string;
		verifiedTitle: string;
		verifiedHint: string;
		declaredTitle: string;
		declaredHint: string;
		emptyTitle: string;
		emptyBody: string;
		addCta: string;
		formProvider: string;
		formUrl: string;
		formTitle: string;
		formSubmit: string;
		addedToast: string;
		autoVerifiedToast: string;
		pendingReview: string;
		remove: string;
		removeConfirm: string;
		removedToast: string;
		maxReached: string;
		providers: {
			github: string;
			medium: string;
			dev_to: string;
			conf_ref: string;
			behance: string;
			dribbble: string;
			artstation: string;
			vimeo: string;
			foundry: string;
		};
	};
	/** T2-04 — call-to-action copy on promotion notifications. */
	promotionNotifs: {
		rankCta: string;
		unlockedSlices: string;
		unlockedNone: string;
		capabilityCta: string;
		badgeCta: string;
		firstVerifiedCta: string;
		goalCta: string;
	};
	/** T3-01 — the disclosed learning companion. */
	assistant: {
		title: string;
		subtitle: string;
		disclosureBanner: string;
		disclosureDetail: string;
		quotaLabel: string;
		quotaRemaining: string;
		quotaExhausted: string;
		quotaResets: string;
		types: {
			explain: string;
			generate_exercises: string;
			pre_review: string;
			debug_help: string;
		};
		typeHints: {
			explain: string;
			generate_exercises: string;
			pre_review: string;
			debug_help: string;
		};
		promptLabel: string;
		promptPlaceholder: string;
		codeLabel: string;
		codePlaceholder: string;
		languageLabel: string;
		skillLabel: string;
		submit: string;
		thinking: string;
		answerTitle: string;
		answerCached: string;
		answerModel: string;
		answerDisclosure: string;
		itemsTitle: string;
		historyTitle: string;
		historyEmpty: string;
		historyUndisclosedOnly: string;
		historyDisclosedOn: string;
		historyNotDisclosed: string;
		promptTooLong: string;
		codeTooLong: string;
		rateLimited: string;
	};
	/** T3-02 — the reverse marketplace. */
	talentOffers: {
		title: string;
		subtitle: string;
		emptyTitle: string;
		emptyBody: string;
		filterType: string;
		filterAll: string;
		filterSkill: string;
		filterFree: string;
		free: string;
		pricePerHour: string;
		hoursPerWeek: string;
		contactCta: string;
		types: {
			pair_programming: string;
			code_review: string;
			whiteboard: string;
			mock_interview: string;
			career_advice: string;
		};
		mineTitle: string;
		mineSubtitle: string;
		mineEmpty: string;
		mineNewCta: string;
		cannotPublish: string;
		cannotPublishHint: string;
		maxReached: string;
		formType: string;
		formSkill: string;
		formSkillNone: string;
		formHours: string;
		formPrice: string;
		formPriceHint: string;
		formPriceFree: string;
		formDescription: string;
		formSubmit: string;
		createdToast: string;
		updatedToast: string;
		activeLabel: string;
		pausedLabel: string;
		pause: string;
		resume: string;
		deleteCta: string;
		deleteConfirm: string;
		deletedToast: string;
		vsMentorship: string;
	};
	/** T3-03 — reputation staking. */
	vouchings: {
		title: string;
		subtitle: string;
		profileTitle: string;
		profileHint: string;
		vouchedBy: string;
		activeUntil: string;
		stakes: {
			rank_temporary: string;
			reputation_only: string;
		};
		stakeHints: {
			rank_temporary: string;
			reputation_only: string;
		};
		vouchCta: string;
		formTitle: string;
		formWindow: string;
		formWindowUnit: string;
		formStake: string;
		formStatement: string;
		formStatementPlaceholder: string;
		formSubmit: string;
		createdToast: string;
		givenTitle: string;
		givenEmpty: string;
		receivedTitle: string;
		receivedEmpty: string;
		liveCount: string;
		withdraw: string;
		withdrawConfirm: string;
		withdrawnToast: string;
		brokenLabel: string;
		brokenReason: string;
		rankFloor: string;
		noStatement: string;
	};
	/** T3-04 — the skill tree with prerequisites. */
	skillTree: {
		title: string;
		subtitle: string;
		emptyTitle: string;
		emptyBody: string;
		filterDomain: string;
		filterAll: string;
		legendTitle: string;
		statuses: {
			locked: string;
			unlocked: string;
			in_progress: string;
			mastered: string;
		};
		statusHints: {
			locked: string;
			unlocked: string;
			in_progress: string;
			mastered: string;
		};
		missingPrerequisites: string;
		provenCount: string;
		levelLabel: string;
		expandAll: string;
		collapseAll: string;
		summary: string;
	};
}
