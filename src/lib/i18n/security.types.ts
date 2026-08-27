/**
 * Translation keys for the Skilluv Cyber programme (SKI-116 … SKI-284).
 *
 * Folded into `Translations` the same way the design namespaces are. One
 * namespace per surface: the disclosure programme, the reporter's own view,
 * the hall of fame, the trust centre, practice, research mode, external
 * bounties, credentials and the profile section.
 */
export interface SecurityTranslations {
	/** T-01 — the scope, and what the programme promises. */
	securityScope: {
		title: string;
		subtitle: string;
		inScopeTitle: string;
		outOfScopeTitle: string;
		contactLabel: string;
		policyCta: string;
		slaLabel: string;
		embargoLabel: string;
		safeHarbourTitle: string;
		safeHarbourBody: string;
		reportCta: string;
		researchModeTitle: string;
		researchModeBody: string;
		researchModeCta: string;
		rewardsTitle: string;
		rewardsHint: string;
		fragmentsFor: string;
		orientationsTitle: string;
		reviewerGroup: string;
	};

	/** T-02 / T-03 — filing a report, and the proofs that go with it. */
	securityReport: {
		title: string;
		subtitle: string;
		fieldTitle: string;
		fieldDescription: string;
		fieldDescriptionHint: string;
		fieldRepro: string;
		fieldReproHint: string;
		fieldImpact: string;
		fieldFix: string;
		fieldTargetKind: string;
		fieldTargetHost: string;
		fieldEndpoint: string;
		fieldSeverity: string;
		fieldSeverityHint: string;
		fieldCvss: string;
		fieldCwe: string;
		anonymousLabel: string;
		anonymousHint: string;
		proofsTitle: string;
		proofsHint: string;
		proofAdd: string;
		proofStored: string;
		proofFailed: string;
		proofNotALink: string;
		submitCta: string;
		submittedTitle: string;
		submittedBody: string;
		rateLimited: string;
		targetKinds: {
			platform: string;
			mission: string;
			project: string;
			other: string;
		};
	};

	/** The reporter's own view of what they filed. */
	securityMyReports: {
		title: string;
		subtitle: string;
		empty: string;
		emptyHint: string;
		reportedAs: string;
		triageDue: string;
		embargoUntil: string;
		openRoundTitle: string;
		answerPlaceholder: string;
		answerCta: string;
		answeredToast: string;
		withdrawCta: string;
		withdrawnToast: string;
		tooLateToWithdraw: string;
		writeupCta: string;
		statuses: {
			submitted: string;
			triaged: string;
			confirmed: string;
			duplicate: string;
			not_applicable: string;
			withdrawn: string;
			fixed: string;
			published: string;
		};
		statusHints: {
			duplicate: string;
			not_applicable: string;
		};
		severities: {
			critical: string;
			high: string;
			medium: string;
			low: string;
			informational: string;
		};
		stages: {
			embargoed: string;
			extension_requested: string;
			partially_disclosed: string;
			public: string;
			withheld: string;
		};
	};

	/** One finding, as a stranger reads it. */
	securityFinding: {
		title: string;
		embargoedTitle: string;
		embargoedBody: string;
		reportedBy: string;
		anonymousReporter: string;
		confirmedOn: string;
		publishedOn: string;
		cvssLabel: string;
		cweLabel: string;
		writeupCta: string;
		notFound: string;
	};

	/** B-05 — the defensive labs. */
	blueLab: {
		title: string;
		subtitle: string;
		offlineNote: string;
		empty: string;
		emptyHint: string;
		filterAll: string;
		openCta: string;
		lockedCta: string;
		locked: string;
		minutes: string;
		tiers: {
			easy: string;
			medium: string;
			hard: string;
			insane: string;
		};
	};

	/** T-05 — the hall of fame. */
	securityHallOfFame: {
		title: string;
		subtitle: string;
		contributorsTitle: string;
		recentTitle: string;
		empty: string;
		emptyHint: string;
		findingCount: string;
		topSeverity: string;
		since: string;
		anonymous: string;
		statConfirmed: string;
		statPublished: string;
		statFixed: string;
		statReporters: string;
		statMedianDays: string;
	};

	/** T-10 — the trust centre. */
	securityTrust: {
		title: string;
		subtitle: string;
		documentsTitle: string;
		complianceTitle: string;
		complianceHonesty: string;
		contactsTitle: string;
		programmeTitle: string;
		safeHarbour: string;
		noSafeHarbour: string;
		scopeTitle: string;
		sameNumbersNote: string;
		states: {
			self_assessed: string;
			not_started: string;
			in_progress: string;
			certified: string;
		};
	};

	/** C-05 / B-05 — practice: flags and graded labs. */
	securityPractice: {
		ctfTitle: string;
		ctfSubtitle: string;
		scoreboardTitle: string;
		scoreboardEmpty: string;
		solves: string;
		firstSolves: string;
		lastSolve: string;
		flagTitle: string;
		flagPlaceholder: string;
		flagCta: string;
		flagCorrect: string;
		flagWrong: string;
		flagFirstBlood: string;
		attemptsLeft: string;
		fragmentsAwarded: string;
		attestationIssued: string;
		labTitle: string;
		labSubmitCta: string;
		labScore: string;
		labPassed: string;
		labFailed: string;
		labWrongQuestions: string;
		labAttemptsLeft: string;
		listTitle: string;
		listEmpty: string;
		listEmptyHint: string;
		openChallenge: string;
		lockedChallenge: string;
	};

	/** Research mode — a token that raises a rate limit and nothing else. */
	securityResearch: {
		title: string;
		subtitle: string;
		noToken: string;
		issueCta: string;
		labelField: string;
		daysField: string;
		issuedTitle: string;
		issuedOnce: string;
		copyCta: string;
		copiedToast: string;
		headerLabel: string;
		grantsNothing: string;
		prefixLabel: string;
		issuedAt: string;
		expiresAt: string;
		lastUsed: string;
		neverUsed: string;
		requestsSeen: string;
		revokeCta: string;
		revokedToast: string;
		multiplier: string;
	};

	/** Curated programmes elsewhere, and what somebody claims from them. */
	securityBounties: {
		title: string;
		subtitle: string;
		empty: string;
		filterPlatform: string;
		filterAll: string;
		paidOnly: string;
		openProgramme: string;
		claimsTitle: string;
		claimsEmpty: string;
		claimCta: string;
		claimPlatform: string;
		claimOrganisation: string;
		claimReportUrl: string;
		claimReportUrlHint: string;
		claimSeverity: string;
		claimCwe: string;
		claimSummary: string;
		claimDisclosedOn: string;
		claimSubmit: string;
		claimedToast: string;
		claimStates: {
			waiting: string;
			confirmed: string;
			refused: string;
		};
		refusedReason: string;
	};

	/** M-11 — certifications somebody says they hold. */
	securityCredentials: {
		title: string;
		subtitle: string;
		verifiedTitle: string;
		declaredTitle: string;
		declaredHint: string;
		empty: string;
		addTitle: string;
		fieldIssuer: string;
		fieldName: string;
		fieldLevel: string;
		fieldCredentialId: string;
		fieldEvidence: string;
		fieldEvidenceHint: string;
		fieldIssuedOn: string;
		fieldExpiresOn: string;
		addCta: string;
		addedToast: string;
		lapsed: string;
		verifiedOn: string;
		openEvidence: string;
	};
}
