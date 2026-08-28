/**
 * Translation keys for the design workflow surfaces.
 *
 * Separate from `design.types.ts`, which covers the four public-facing tickets
 * (contests, missions, profile, onboarding). This file is the working half of
 * the programme: the critique loop a designer lives in, the tools they
 * connect, the briefs they propose, and what a mission looks like once it is
 * actually running.
 */
export interface DesignWorkflowTranslations {
	/** W-05/W-08/W-09 — the critique loop on a design slice. */
	designWorkshop: {
		trailTitle: string;
		trailEmpty: string;
		trailPublicNote: string;
		roundLabel: string;
		decisions: {
			approve: string;
			iterate: string;
			reject: string;
			pending: string;
		};
		blockingReason: string;
		authorNotes: string;
		reviewerFeedback: string;
		openArtifact: string;
		gridTitle: string;
		compareTitle: string;
		compareFrom: string;
		compareTo: string;
		compareCta: string;
		compareStrategy: string;
		compareStrategyUnknown: string;
		compareBetween: string;
		compareSameRound: string;
		checksTitle: string;
		checksEmpty: string;
		checksNotAVerdict: string;
		severities: {
			info: string;
			warning: string;
			error: string;
		};
		submitTitle: string;
		submitArtifactUrl: string;
		submitArtifactUrlHint: string;
		submitByLink: string;
		submitByFile: string;
		submitFileReady: string;
		submitNotes: string;
		submitNotesHint: string;
		submitCta: string;
		submitToast: string;
		roundsUsed: string;
		roundsCeiling: string;
		queueTitle: string;
		queueSubtitle: string;
		queueEmpty: string;
		queueEmptyHint: string;
		reviewCta: string;
	};

	/** W-02 — handing in a file too large for the API. */
	designUpload: {
		title: string;
		subtypeLabel: string;
		pickFile: string;
		ceiling: string;
		tooLarge: string;
		previewRequired: string;
		previewPick: string;
		previewDone: string;
		uploading: string;
		progress: string;
		done: string;
		failed: string;
		etagMisconfigured: string;
		cancel: string;
		resume: string;
		downloadCta: string;
		subtypes: {
			brand_kit: string;
			icon_set: string;
			type_family: string;
			copy_deck: string;
			research_document: string;
			interface: string;
			design_system: string;
			illustration_set: string;
			sound: string;
			motion: string;
			video: string;
			three_d_scene: string;
		};
	};

	/** W-03/W-04 — connecting Figma, Miro or Webflow, and reading a link. */
	designTools: {
		title: string;
		subtitle: string;
		connectionsTitle: string;
		connectionsEmpty: string;
		connectedSince: string;
		expiresAt: string;
		connectCta: string;
		disconnectCta: string;
		disconnectedToast: string;
		unavailableTitle: string;
		unavailableBody: string;
		inspectTitle: string;
		inspectSubtitle: string;
		inspectPlaceholder: string;
		inspectCta: string;
		inspectRecognised: string;
		inspectUnknown: string;
		inspectOpensFreely: string;
		inspectNeedsAccount: string;
		inspectTooLong: string;
		/** Rendered from `warning_code`, so an English reader gets English. */
		warnUnrecognisedLink: string;
		warnNeedsPublicSharing: string;
		providers: {
			figma: string;
			miro: string;
			webflow: string;
		};
	};

	/** T-02 — proposing a brief for the curated queue. */
	designBriefs: {
		title: string;
		subtitle: string;
		proposeTitle: string;
		fieldTitle: string;
		fieldBrief: string;
		fieldBriefHint: string;
		fieldOrientation: string;
		fieldSubtype: string;
		fieldDifficulty: string;
		fieldHours: string;
		fieldRounds: string;
		fieldRoundsHint: string;
		fieldFormat: string;
		formats: {
			individual: string;
			contest: string;
		};
		submitCta: string;
		submittedToast: string;
		mineTitle: string;
		mineEmpty: string;
		notAChallengeYet: string;
		withdrawCta: string;
		withdrawnToast: string;
		rejectedFeedback: string;
		openPublished: string;
		statuses: {
			pending: string;
			published: string;
			rejected: string;
			withdrawn: string;
		};
	};

	/** O-02 — what to spend this week on. */
	nextChallenges: {
		title: string;
		subtitle: string;
		empty: string;
		emptyHint: string;
		cachedNote: string;
		refresh: string;
		whyTitle: string;
		scoreLabel: string;
		closesAt: string;
		hours: string;
		difficulty: string;
		formats: {
			individual: string;
			contest: string;
		};
		openCta: string;
	};

	/** M-04/M-05 — a mission once it is actually running. */
	missionWork: {
		title: string;
		subtitle: string;
		ndaTitle: string;
		ndaUnreviewed: string;
		ndaSignedOn: string;
		ndaTypedName: string;
		ndaTypedNameHint: string;
		ndaSignCta: string;
		ndaSignedToast: string;
		ndaChangedError: string;
		ndaReleased: string;
		roundsTitle: string;
		roundsEmpty: string;
		roundsNormal: string;
		roundLabel: string;
		beyondAgreed: string;
		deliverTitle: string;
		deliverUrl: string;
		deliverNotes: string;
		deliverCta: string;
		deliveredToast: string;
		acceptCta: string;
		acceptedToast: string;
		requestChangesCta: string;
		requestChangesReason: string;
		requestChangesHint: string;
		requestedToast: string;
		awaitingDecision: string;
		decisions: {
			accepted: string;
			changes_requested: string;
		};
		ratingsTitle: string;
		ratingsBlind: string;
		rateCta: string;
		rateValue: string;
		rateComment: string;
		ratedToast: string;
		standingLabel: string;
		standingNone: string;
		invoicesTitle: string;
		invoicesEmpty: string;
		invoiceAmount: string;
		invoiceCommission: string;
		payCta: string;
		applicationsTitle: string;
		applicationsEmpty: string;
		verifiedAttestations: string;
		declaredLinks: string;
		acceptApplicant: string;
		rejectApplicant: string;
		rejectReason: string;
		decidedToast: string;
	};

	/** L-02 — a contest entry accused of being copied. */
	designPlagiarism: {
		flagCta: string;
		flagTitle: string;
		flagIntro: string;
		flagReason: string;
		flagReasonHint: string;
		flagEvidence: string;
		flagEvidenceHint: string;
		flagSubmit: string;
		flaggedToast: string;
		alreadyOpen: string;
		caseTitle: string;
		caseNotYours: string;
		accusedLabel: string;
		raisedByLabel: string;
		raisedAt: string;
		respondBy: string;
		windowClosed: string;
		respondTitle: string;
		respondHint: string;
		respondCta: string;
		respondedToast: string;
		decisionTitle: string;
		priorCases: string;
		statuses: {
			open: string;
			answered: string;
			upheld: string;
			dismissed: string;
		};
	};

	/** G-03 — the toolkit of a family, and where to go and contribute. */
	designPractice: {
		title: string;
		subtitle: string;
		toolkitTitle: string;
		toolkitEmpty: string;
		accessLabel: string;
		openTool: string;
		allOrientations: string;
		filterCategory: string;
		filterAll: string;
		terrainsTitle: string;
		terrainsSubtitle: string;
		terrainsEmpty: string;
		whyTitle: string;
		adopted: string;
		adoptedOn: string;
		notAdopted: string;
		notAdoptedHint: string;
		openUpstream: string;
		openProject: string;
		declinedReason: string;
	};

	/** P-03 — who the platform puts forward this week. */
	featuredTalent: {
		title: string;
		subtitle: string;
		empty: string;
		weekOf: string;
		whyTitle: string;
		seeProfile: string;
		historyTitle: string;
		noPostingNote: string;
	};

	/** C-02/C-04 — the annual awards. */
	designAwards: {
		title: string;
		subtitle: string;
		editionOf: string;
		noEdition: string;
		noEditionHint: string;
		statuses: {
			draft: string;
			nominations: string;
			voting: string;
			concluded: string;
		};
		weights: string;
		prizePerCategory: string;
		nominationsClose: string;
		votingCloses: string;
		categoriesTitle: string;
		categoryEmpty: string;
		nomineesTitle: string;
		citationLabel: string;
		shortlisted: string;
		notShortlisted: string;
		communityVotes: string;
		juryVotes: string;
		weightedScore: string;
		voteCta: string;
		voteJuryCta: string;
		votedToast: string;
		nominateTitle: string;
		nominateCategory: string;
		nominateSubject: string;
		nominateSubjectHint: string;
		nominateCitation: string;
		nominateCitationHint: string;
		nominateCta: string;
		nominatedToast: string;
		closedNote: string;
		previousEditions: string;
	};

	/** C-04/C-05 — contests that belong together. */
	designSeries: {
		title: string;
		subtitle: string;
		runningTitle: string;
		pastTitle: string;
		empty: string;
		emptyHint: string;
		openCta: string;
		backCta: string;
		everyDomain: string;
		notFound: string;
		noStandings: string;
		noPodium: string;
		kinds: {
			awards_edition: string;
			sprint: string;
			programme: string;
		};
	};

	/** O-03 — mentors worth suggesting, with the reasoning attached. */
	mentorMatches: {
		title: string;
		subtitle: string;
		wouldHelp: string;
		empty: string;
		emptyHint: string;
		whyTitle: string;
		craftScore: string;
		activeMentees: string;
		timezoneGap: string;
		openCta: string;
	};

	/** A-04 — the part of a profile a finished image cannot show. */
	designIterationStories: {
		title: string;
		subtitle: string;
		empty: string;
		roundsTaken: string;
		firstVersion: string;
		finalVersion: string;
		validatedOn: string;
	};
}
