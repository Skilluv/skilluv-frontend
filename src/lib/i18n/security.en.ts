import type { SecurityTranslations } from './security.types';

export const securityEn: SecurityTranslations = {
	securityScope: {
		title: 'Reporting a vulnerability',
		subtitle: 'What is in scope, what is not, and what we promise back.',
		inScopeTitle: 'In scope',
		outOfScopeTitle: 'Out of scope',
		contactLabel: 'Contact',
		policyCta: 'Read the full policy',
		slaLabel: 'Triaged within {n} days',
		embargoLabel: 'Default embargo: {n} days',
		safeHarbourTitle: 'Safe harbour',
		safeHarbourBody:
			'Test what is listed above, within the published rate limits, and we will not come after you. Step outside it and that protection does not follow you.',
		reportCta: 'Report something',
		researchModeTitle: 'Research mode',
		researchModeBody:
			'A token raises your rate limit by {n}× and grants nothing else. It is not permission to test anything not listed above.',
		researchModeCta: 'Get a token',
		rewardsTitle: 'What a confirmed finding is worth',
		rewardsHint: 'Read from the platform, not printed here: the table moves and a stale figure is a broken promise.',
		fragmentsFor: '{n} fragments',
		orientationsTitle: 'The five branches',
		reviewerGroup: 'Reviewed by {group}'
	},

	securityReport: {
		title: 'Report a vulnerability',
		subtitle: 'Written so somebody who has never seen it can reproduce it.',
		fieldTitle: 'Title',
		fieldDescription: 'What it is',
		fieldDescriptionHint: 'The defect, in your words. What breaks, and why it matters.',
		fieldRepro: 'How to reproduce it',
		fieldReproHint:
			'Step by step, from a clean state. A report nobody can follow is a report nobody can confirm.',
		fieldImpact: 'What it lets somebody do',
		fieldFix: 'How you would fix it',
		fieldTargetKind: 'What it affects',
		fieldTargetHost: 'Host',
		fieldEndpoint: 'Affected endpoint',
		fieldSeverity: 'How bad you think it is',
		fieldSeverityHint: 'Your call. Triage may land elsewhere, and both are kept.',
		fieldCvss: 'CVSS vector',
		fieldCwe: 'CWE',
		anonymousLabel: 'Report without my name on it',
		anonymousHint: 'You are still credited privately. Only the hall of fame shows an alias.',
		proofsTitle: 'Proofs',
		proofsHint:
			'Screenshots, a capture, a short video. Uploaded first, because you take them while you still have the exploit in front of you.',
		proofAdd: 'Add a proof',
		proofStored: 'Stored.',
		proofFailed: 'That file was refused.',
		proofNotALink:
			'A proof of an unfixed vulnerability gets no stable address. These are keys, not links.',
		submitCta: 'Send the report',
		submittedTitle: 'Received',
		submittedBody: 'You will hear back by {date}. That is what the policy promises.',
		rateLimited: 'Five reports an hour. Take a moment — nothing is lost.',
		targetKinds: {
			platform: 'The platform itself',
			mission: 'A mission',
			project: 'A project',
			other: 'Something else'
		}
	},

	securityMyReports: {
		title: 'What you reported',
		subtitle: 'Where each one is, and what is waiting on you.',
		empty: 'You have not reported anything.',
		emptyHint: 'Read the scope first, then report what you find.',
		reportedAs: 'You called it {tier}',
		triageDue: 'Answer due {date}',
		embargoUntil: 'Embargoed until {date}',
		openRoundTitle: 'A reviewer asked for something',
		answerPlaceholder: 'Your answer.',
		answerCta: 'Answer',
		answeredToast: 'Sent.',
		withdrawCta: 'Withdraw',
		withdrawnToast: 'Withdrawn.',
		tooLateToWithdraw: 'This one has been acted on. It cannot be un-reported.',
		writeupCta: 'Read the writeup',
		statuses: {
			submitted: 'Waiting on triage',
			triaged: 'Triaged',
			confirmed: 'Confirmed',
			duplicate: 'Duplicate',
			not_applicable: 'Not applicable',
			withdrawn: 'Withdrawn',
			fixed: 'Fixed',
			published: 'Published'
		},
		statusHints: {
			duplicate: 'Somebody found it first. It was still work, and it still counts as such.',
			not_applicable: 'Judged not to be a defect. The reasoning is on the report.'
		},
		severities: {
			critical: 'Critical',
			high: 'High',
			medium: 'Medium',
			low: 'Low',
			informational: 'Informational'
		},
		stages: {
			embargoed: 'Embargoed',
			extension_requested: 'Extension requested',
			partially_disclosed: 'Partly disclosed',
			public: 'Public',
			withheld: 'Withheld'
		}
	},

	securityFinding: {
		title: 'Finding',
		embargoedTitle: 'Not published yet',
		embargoedBody:
			'What it is stays withheld until it is fixed and disclosed. What you can see is that somebody found something of this severity, in this weakness class, on this date — which is the claim the attestation makes.',
		reportedBy: 'Reported by',
		anonymousReporter: 'Reported anonymously',
		confirmedOn: 'Confirmed {date}',
		publishedOn: 'Published {date}',
		cvssLabel: 'CVSS',
		cweLabel: 'Weakness class',
		writeupCta: 'Read the writeup',
		notFound: 'No finding carries this identifier.'
	},

	securityCompetitions: {
		title: 'Competitions',
		subtitle: 'Attack, defend, or audit against the clock — and against everybody else.',
		liveTitle: 'Running now',
		upcomingTitle: 'Open for entry',
		pastTitle: 'Finished',
		empty: 'No competition scheduled.',
		emptyHint: 'They run in seasons rather than continuously, so the board is empty between them.',
		openCta: 'Open',
		registerCta: 'Enter',
		everyDomain: 'Open to every domain',
		prizePool: '{n} fragments in the pot',
		kinds: {
			sec_ctf_jeopardy: 'CTF jeopardy',
			sec_attack_defence: 'Attack & defence',
			sec_bug_bash: 'Bug bash',
			sec_purple_exercise: 'Purple exercise',
			sec_code_audit_rally: 'Code audit rally'
		}
	},

	blueLab: {
		title: 'Defensive labs',
		subtitle: 'An artefact from a real incident, and the questions it should let you answer.',
		offlineNote:
			'You download the artefact and open it in your own tools, on your own machine. Only your answers come back — nothing you run is sent to Skilluv.',
		empty: 'No lab available.',
		emptyHint: 'Labs are built from real incidents, so they arrive in batches rather than steadily.',
		filterAll: 'All',
		openCta: 'Open',
		lockedCta: 'See what it needs',
		locked: 'Locked',
		minutes: '{n} min',
		artifactTitle: 'The artefact',
		artifactCta: 'Get the download link',
		artifactExpires: 'This link stops working in about {n} min. Ask for another if it does.',
		tiers: {
			easy: 'Easy',
			medium: 'Medium',
			hard: 'Hard',
			insane: 'Insane'
		}
	},

	securityHallOfFame: {
		title: 'Hall of fame',
		subtitle: 'The people who told us before somebody else found out.',
		contributorsTitle: 'Contributors',
		recentTitle: 'Recently published',
		empty: 'Nobody yet.',
		emptyHint: 'Every confirmed finding puts a name here, unless its reporter asked otherwise.',
		findingCount: '{n} findings',
		topSeverity: 'Highest: {tier}',
		since: 'Since {date}',
		anonymous: 'Chose not to be named',
		statConfirmed: 'confirmed',
		statPublished: 'published',
		statFixed: 'fixed',
		statReporters: 'reporters',
		statMedianDays: 'median days to publication'
	},

	securityTrust: {
		title: 'Trust centre',
		subtitle: 'What we do about security, and what we have not done yet.',
		documentsTitle: 'Documents',
		complianceTitle: 'Compliance',
		complianceHonesty:
			'Stated as it is. A self-assessment is not an audit, and nothing here claims to be one.',
		contactsTitle: 'Contacts',
		programmeTitle: 'Disclosure programme',
		safeHarbour: 'Safe harbour for good-faith research',
		noSafeHarbour: 'No safe harbour declared',
		scopeTitle: 'In scope',
		sameNumbersNote:
			'These figures come from the same rows as the hall of fame. Two pages cannot quote different numbers.',
		states: {
			self_assessed: 'Self-assessed',
			not_started: 'Not started',
			in_progress: 'In progress',
			certified: 'Certified'
		}
	},

	securityPractice: {
		ctfTitle: 'Capture the flag',
		ctfSubtitle: 'Ranges we host, flags we planted, and who got there first.',
		scoreboardTitle: 'Scoreboard',
		scoreboardEmpty: 'Nobody has solved anything yet.',
		solves: '{n} solves',
		firstSolves: '{n} first',
		lastSolve: 'Last solve {date}',
		flagTitle: 'Submit a flag',
		flagPlaceholder: 'skilluv{…}',
		targetLabel: 'Target:',
		formatLabel: 'Flags on this one look like',
		liveNote: 'Updating live.',
		labChoosePlaceholder: 'Choose an answer',
		labCaseSensitive: 'Compared as typed.',
		labPassPercent: '{n}% right to pass',
		labMaxAttempts: '{n} attempts',
		flagCta: 'Submit',
		flagCorrect: 'Correct.',
		flagWrong: 'Not that one.',
		flagFirstBlood: 'First solve. Nobody had this one before you.',
		attemptsLeft: '{n} attempts left this hour',
		fragmentsAwarded: '{n} fragments',
		attestationIssued: 'An attestation was issued.',
		labTitle: 'Answer the lab',
		labSubmitCta: 'Submit answers',
		labScore: '{correct} of {total} — {percent}%',
		labPassed: 'Passed.',
		labFailed: 'Not this time.',
		labWrongQuestions: 'Wrong: {ids}',
		labAttemptsLeft: '{n} attempts left',
		listTitle: 'Ranges',
		listEmpty: 'No range open.',
		listEmptyHint: 'Ranges are hosted, so they come and go with what is deployed.',
		openChallenge: 'Open',
		lockedChallenge: 'See what it needs'
	},

	securityResearch: {
		title: 'Research mode',
		subtitle: 'A token that raises your rate limit. Nothing else.',
		noToken: 'No token issued.',
		issueCta: 'Issue a token',
		labelField: 'Label',
		daysField: 'Days',
		issuedTitle: 'Your token',
		issuedOnce: 'Shown once. Copy it now — a reload loses it, and issuing another replaces this one.',
		copyCta: 'Copy',
		copiedToast: 'Copied.',
		headerLabel: 'Send it in',
		grantsNothing:
			'It raises a rate limit and grants nothing. It is not permission to test anything out of scope, and it will not protect you there.',
		prefixLabel: 'Prefix',
		issuedAt: 'Issued {date}',
		expiresAt: 'Expires {date}',
		lastUsed: 'Last used {date}',
		neverUsed: 'Never used',
		requestsSeen: '{n} requests',
		revokeCta: 'Revoke',
		revokedToast: 'Revoked.',
		multiplier: '{n}× the normal limit'
	},

	securityBounties: {
		title: 'Bounty programmes',
		subtitle: 'Public programmes worth an evening. We run none of them.',
		empty: 'Nothing curated right now.',
		filterPlatform: 'Platform',
		filterAll: 'All',
		paidOnly: 'Paying only',
		openProgramme: 'Open',
		claimsTitle: 'What you claimed',
		claimsEmpty: 'You have claimed nothing from elsewhere.',
		claimCta: 'Claim work done elsewhere',
		claimPlatform: 'Platform',
		claimOrganisation: 'Organisation',
		claimReportUrl: 'Link to the report',
		claimReportUrlHint: 'Public, so a reviewer can open it. Your word is not the check.',
		claimSeverity: 'Severity you were given',
		claimCwe: 'CWE',
		claimSummary: 'What it was',
		claimDisclosedOn: 'Disclosed on',
		claimSubmit: 'Claim it',
		claimedToast: 'Filed. A reviewer will open the link.',
		claimStates: {
			waiting: 'Waiting on review',
			confirmed: 'Confirmed',
			refused: 'Refused'
		},
		refusedReason: 'Why: {reason}'
	},

	securityCredentials: {
		title: 'Certifications',
		subtitle: 'What you hold, and which of it somebody has checked.',
		verifiedTitle: 'Verified',
		declaredTitle: 'Declared',
		declaredHint:
			'Your word until a reviewer opens the issuer’s page. Shown as such, because you are the person it belongs to.',
		empty: 'Nothing recorded.',
		addTitle: 'Record a certification',
		fieldIssuer: 'Issuer',
		fieldName: 'Name',
		fieldLevel: 'Level',
		fieldCredentialId: 'Credential number',
		fieldEvidence: 'Public link',
		fieldEvidenceHint: 'Required: a certification nobody can open is a sentence.',
		fieldIssuedOn: 'Obtained on',
		fieldExpiresOn: 'Expires on',
		addCta: 'Record it',
		addedToast: 'Recorded, and waiting on a check.',
		lapsed: 'Lapsed',
		verifiedOn: 'Checked {date}',
		openEvidence: 'Open'
	}
};
