/**
 * Translation keys for the Skilluv Design programme (SKI-182 … SKI-268).
 *
 * Folded into `Translations` the same way the Post-MVP namespaces are. Four
 * namespaces, one per front ticket: contests (SKI-237), missions (SKI-248),
 * the profile section (SKI-253) and the onboarding wizard (SKI-265).
 */
export interface DesignTranslations {
	/** SKI-237 — contests, which are `brief_contest` tournaments. */
	designContests: {
		title: string;
		subtitle: string;
		liveTitle: string;
		upcomingTitle: string;
		pastTitle: string;
		emptyTitle: string;
		emptyBody: string;
		viewCta: string;
		galleryCta: string;
		resultsCta: string;
		prizePool: string;
		entrantCount: string;
		submissionCount: string;
		opensAt: string;
		runsFrom: string;
		endsOn: string;
		daysLeft: string;
		hoursLeft: string;
		closed: string;
		statuses: {
			upcoming: string;
			registration: string;
			active: string;
			concluded: string;
			cancelled: string;
		};
		briefTitle: string;
		briefMissing: string;
		criteriaTitle: string;
		deliverablesTitle: string;
		moodboardCta: string;
		timelineTitle: string;
		juryTitle: string;
		juryEmpty: string;
		juryAccepted: string;
		juryInvited: string;
		juryDeclined: string;
		sponsorLabel: string;
		registerCta: string;
		registeredToast: string;
		registeredLabel: string;
		submitCta: string;
		submitTitle: string;
		submitArtifactUrl: string;
		submitArtifactUrlHint: string;
		submitArtifactType: string;
		submitSecondaryUrl: string;
		submitSecondaryUrlHint: string;
		submitSummary: string;
		submitSummaryPlaceholder: string;
		submitSend: string;
		submittedToast: string;
		resubmitNotice: string;
		galleryTitle: string;
		galleryEmpty: string;
		galleryOpenArtifact: string;
		gallerySecondary: string;
		voteCta: string;
		votedCta: string;
		voteCount: string;
		voteOneVoice: string;
		voteSignedOut: string;
		votedToast: string;
		judgeScore: string;
		judgeNotes: string;
		submissionStatuses: {
			submitted: string;
			accepted: string;
			rejected: string;
			disqualified: string;
		};
		resultsTitle: string;
		resultsPending: string;
		podiumFirst: string;
		podiumSecond: string;
		podiumThird: string;
		otherEntries: string;
		yourEntry: string;
		noStanding: string;
		awardsNotice: string;
	};
	/** SKI-248 — paid design missions, on the shared `/missions` endpoint. */
	/**
	 * Paid missions, every domain.
	 *
	 * Named `designMissions` until the AI board needed the same copy: apart
	 * from the title and subtitle, none of it was ever design-specific —
	 * `/missions` is one endpoint for every domain, and a rights badge reads
	 * the same whoever is signing. The per-domain copy lives in each board's
	 * own namespace.
	 */
	missions: {
		/** Board name per domain: the only copy here that was ever domain-specific. */
		boards: {
			design: { title: string; subtitle: string };
			ai: { title: string; subtitle: string };
		};
		howItWorksTitle: string;
		howItWorksBody: string;
		commissionNotice: string;
		emptyTitle: string;
		emptyBody: string;
		filterType: string;
		filterAll: string;
		filterIpTerms: string;
		filterPayment: string;
		filterUrgency: string;
		filterMinBudget: string;
		filterRemote: string;
		viewCta: string;
		budgetLabel: string;
		hourlyLabel: string;
		revenueShareLabel: string;
		budgetUnset: string;
		estimatedDays: string;
		closesAt: string;
		remoteOnly: string;
		ndaRequired: string;
		ndaNotice: string;
		ipTerms: {
			full_ownership_client: string;
			open_source_output: string;
			retain_reusable_components: string;
			dual_license: string;
		};
		ipTermsHints: {
			full_ownership_client: string;
			open_source_output: string;
			retain_reusable_components: string;
			dual_license: string;
		};
		paymentModels: {
			fixed_price: string;
			per_hour: string;
			per_deliverable: string;
			retainer_monthly: string;
			revenue_share: string;
		};
		deliverableFormats: {
			github_pr: string;
			repository_handover: string;
			library_published: string;
			consulting_report: string;
		};
		urgencies: {
			low: string;
			normal: string;
			high: string;
			critical: string;
		};
		statuses: {
			draft: string;
			published: string;
			applications_closed: string;
			in_progress: string;
			delivered: string;
			closed: string;
			cancelled: string;
		};
		descriptionTitle: string;
		acceptanceTitle: string;
		applyCta: string;
		applyClosed: string;
		applyTitle: string;
		coverLetter: string;
		coverLetterPlaceholder: string;
		portfolioUrls: string;
		portfolioUrlsHint: string;
		pastMissions: string;
		pastMissionsPlaceholder: string;
		availabilityHours: string;
		applySubmit: string;
		appliedToast: string;
		mineTitle: string;
		mineSubtitle: string;
		mineEmpty: string;
		applicationStatuses: {
			applied: string;
			shortlisted: string;
			selected: string;
			rejected: string;
			withdrawn: string;
		};
		decisionReason: string;
		backToList: string;
	};
	/** SKI-253 — the design section of a public profile. */
	designProfile: {
		sectionTitle: string;
		craftScoreTitle: string;
		tierLabel: string;
		nextTierAt: string;
		cappedNotice: string;
		breakdownTitle: string;
		breakdownMeasured: string;
		breakdownPoints: string;
		artefactsTitle: string;
		artefactsHint: string;
		artefactsEmpty: string;
		roundsLabel: string;
		roundsOne: string;
		gridAverage: string;
		verifiedOn: string;
		openArtifact: string;
		contestsTitle: string;
		contestsEmpty: string;
		contestRank: string;
		contestUnranked: string;
		tradesTitle: string;
		tradesEmpty: string;
		tradeValidated: string;
		attestationsTitle: string;
		attestationsEmpty: string;
		verifyCta: string;
		recomputeCta: string;
		recomputedToast: string;
		emptyTitle: string;
		emptyBody: string;
		notAClaim: string;
	};
	/** SKI-265 — the designer onboarding wizard. */
	designWizard: {
		title: string;
		subtitle: string;
		stepOf: string;
		next: string;
		back: string;
		finish: string;
		skip: string;
		savedToast: string;
		partialSaveNotice: string;
		doneTitle: string;
		doneBody: string;
		browseChallenges: string;
		browseContests: string;
		q1Title: string;
		q1Hint: string;
		levels: {
			debutant: string;
			apprentissage: string;
			practitioner: string;
			senior: string;
			researcher: string;
		};
		q2Title: string;
		q2Hint: string;
		q2Max: string;
		q3Title: string;
		q3Hint: string;
		weeklyHours: {
			lt3: string;
			'3_10': string;
			gt10: string;
			fulltime: string;
		};
		q4Title: string;
		q4Hint: string;
		goals: {
			learning: string;
			portfolio: string;
			paid_missions: string;
			academic_research: string;
			startup: string;
		};
		q5Title: string;
		q5Hint: string;
		q5None: string;
		q5Provider: string;
		q5Url: string;
		q5Declared: string;
		q6Title: string;
		q6Hint: string;
		challengePreference: {
			individual: string;
			contest: string;
			both: string;
			undecided: string;
		};
		q7Title: string;
		q7Hint: string;
		tools: {
			figma: string;
			adobe: string;
			sketch: string;
			blender: string;
			after_effects: string;
			other: string;
		};
		pathTitle: string;
		pathIntro: string;
	};
}
