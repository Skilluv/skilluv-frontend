import type { DesignWorkflowTranslations } from './design_workflow.types';

export const designWorkflowEn: DesignWorkflowTranslations = {
	designWorkshop: {
		trailTitle: 'Critique trail',
		trailEmpty: 'No round yet. The first version starts the trail.',
		trailPublicNote:
			'Public on purpose: how a piece got there says more than the piece.',
		roundLabel: 'Round {n}',
		decisions: {
			approve: 'Approved',
			iterate: 'Another round',
			reject: 'Rejected',
			pending: 'Waiting on a critique'
		},
		blockingReason: 'What blocked it',
		authorNotes: 'What the author changed',
		reviewerFeedback: 'The critique',
		openArtifact: 'Open this version',
		gridTitle: 'Grid',
		compareTitle: 'Compare two rounds',
		compareFrom: 'From round',
		compareTo: 'To round',
		compareCta: 'Compare',
		compareStrategy: 'What is worth comparing here',
		compareStrategyUnknown: 'No comparison hint for this kind of deliverable.',
		compareBetween: 'Said in between',
		compareSameRound: 'Pick two different rounds, earliest first.',
		checksTitle: 'Automatic checks',
		checksEmpty: 'Nothing was checked automatically on this piece.',
		checksNotAVerdict:
			'None of this is a verdict. A version can carry an error and still be approved: no check knows whether a mark is right for a cooperative.',
		severities: {
			info: 'Note',
			warning: 'Worth a look',
			error: 'Failed'
		},
		submitTitle: 'Hand in a version',
		submitArtifactUrl: 'Where this version lives',
		submitArtifactUrlHint:
			'A versioned Figma node, a hosted board, a published project, or a file you uploaded.',
		submitNotes: 'What changed',
		submitNotesHint:
			'Optional on the first version, and the single most useful thing to write on any later one.',
		submitCta: 'Ask for a critique',
		submitToast: 'Handed in. It is now waiting for a critique.',
		roundsUsed: '{used} of {expected} announced rounds',
		roundsCeiling: 'Five rounds is the ceiling.',
		queueTitle: 'Waiting for you',
		queueSubtitle: 'Versions in the trades you are competent to judge, oldest first.',
		queueEmpty: 'Nothing waiting.',
		queueEmptyHint:
			'Either the queue is clear, or you hold no review capability yet. Both look the same here.',
		reviewCta: 'Open'
	},

	designUpload: {
		title: 'Upload a deliverable',
		subtypeLabel: 'What kind of deliverable',
		pickFile: 'Choose a file',
		ceiling: 'Up to {size} for this kind.',
		tooLarge: 'That file is over the ceiling for this kind. Nothing was uploaded.',
		previewRequired:
			'A browser cannot open this kind of file, so it has to arrive with a still that represents it. Yours will be a better frame than any automatic one.',
		previewPick: 'Choose the preview',
		previewDone: 'Preview stored.',
		uploading: 'Uploading',
		progress: 'Part {done} of {total}',
		done: 'Uploaded.',
		failed: 'The upload failed.',
		etagMisconfigured:
			'The object store accepted the file but would not say so in a way the browser can read. That is a bucket setting, not your file.',
		cancel: 'Stop',
		resume: 'Resume',
		downloadCta: 'Get a link',
		subtypes: {
			brand_kit: 'Brand kit',
			icon_set: 'Icon set',
			type_family: 'Type family',
			copy_deck: 'Copy deck',
			research_document: 'Research document',
			interface: 'Interface',
			design_system: 'Design system',
			illustration_set: 'Illustration set',
			sound: 'Sound',
			motion: 'Motion',
			video: 'Video',
			three_d_scene: '3D scene'
		}
	},

	designTools: {
		title: 'Design tools',
		subtitle: 'Connect the tools your work lives in, and check a link before you hand it in.',
		connectionsTitle: 'Connected',
		connectionsEmpty: 'Nothing connected.',
		connectedSince: 'Connected {date}',
		expiresAt: 'Expires {date}',
		connectCta: 'Connect',
		disconnectCta: 'Disconnect',
		disconnectedToast: 'Disconnected.',
		unavailableTitle: 'Not available on this deployment',
		unavailableBody:
			'Skilluv holds no developer account with this tool yet, so the connection cannot be made. Nothing is wrong with your account.',
		inspectTitle: 'Check a link',
		inspectSubtitle:
			'A reviewer who cannot open your work cannot validate it. Paste the link before you hand it in, not after.',
		inspectPlaceholder: 'https://…',
		inspectCta: 'Check',
		inspectRecognised: 'Recognised as {provider}.',
		inspectUnknown: 'Not a design tool link we recognise.',
		inspectOpensFreely: 'Opens without an account.',
		inspectNeedsAccount: 'Needs sharing turned on.',
		inspectTooLong: 'That link is too long to check.',
		warnUnrecognisedLink:
			'That link points at no design tool we know. Check it is the address of the deliverable.',
		warnNeedsPublicSharing:
			'A {provider} link is only visible if the file is shared publicly. Check the sharing before you hand it in: a reviewer who cannot open your work cannot validate it.',
		providers: {
			figma: 'Figma',
			miro: 'Miro',
			webflow: 'Webflow'
		}
	},

	designBriefs: {
		title: 'Briefs',
		subtitle: 'Curated briefs are where most design challenges come from. Propose one.',
		proposeTitle: 'Propose a brief',
		fieldTitle: 'Title',
		fieldBrief: 'The brief',
		fieldBriefHint:
			'What is being asked for, for whom, and what would make an answer good. Vague briefs produce vague work.',
		fieldOrientation: 'Orientation',
		fieldSubtype: 'Deliverable',
		fieldDifficulty: 'Difficulty',
		fieldHours: 'Estimated hours',
		fieldRounds: 'Rounds announced',
		fieldRoundsHint: 'What a designer should expect. Five is the ceiling.',
		fieldFormat: 'Format',
		formats: {
			individual: 'Individual challenge',
			contest: 'Contest'
		},
		submitCta: 'Propose',
		submittedToast: 'Proposed. An admin reviews it before it opens.',
		mineTitle: 'What you proposed',
		mineEmpty: 'You have not proposed a brief yet.',
		notAChallengeYet: 'Not open yet: nothing can be claimed until an admin publishes it.',
		withdrawCta: 'Withdraw',
		withdrawnToast: 'Withdrawn.',
		rejectedFeedback: 'Why it was refused',
		openPublished: 'Open the challenge',
		statuses: {
			pending: 'Waiting on review',
			published: 'Published',
			rejected: 'Refused',
			withdrawn: 'Withdrawn'
		}
	},

	designNext: {
		title: 'What to spend this week on',
		subtitle: 'Challenges and contests, ranked together — they answer the same question.',
		empty: 'Nothing to suggest right now.',
		emptyHint: 'Finish your onboarding and a few briefs, and this fills up.',
		cachedNote: 'Held for an hour on purpose: a list that changed every reload would stop reading as advice.',
		refresh: 'Refresh',
		whyTitle: 'Why this one',
		scoreLabel: 'Score',
		closesAt: 'Closes {date}',
		hours: '{n} h',
		difficulty: 'Difficulty {n}',
		formats: {
			individual: 'Solo',
			contest: 'Contest'
		},
		openCta: 'Open'
	},

	designMissionWork: {
		title: 'Mission workspace',
		subtitle: 'The agreement, the rounds, the ratings and the money, in one place.',
		ndaTitle: 'Agreement',
		ndaUnreviewed:
			'This template has not been through a lawyer. Read it as what it is.',
		ndaSignedOn: 'Signed {date}',
		ndaTypedName: 'Type your full name',
		ndaTypedNameHint: 'This is your signature.',
		ndaSignCta: 'Sign',
		ndaSignedToast: 'Signed.',
		ndaChangedError:
			'The agreement changed since it was shown to you. Read the new one before signing.',
		ndaReleased: 'You were released from this on {date}.',
		roundsTitle: 'Rounds',
		roundsEmpty: 'Nothing handed in yet.',
		roundsNormal:
			'Two or three rounds is normal for design work, not a failure. The mission stays in progress until a round is accepted.',
		roundLabel: 'Round {n}',
		beyondAgreed: 'Past the rounds the brief announced',
		deliverTitle: 'Hand in a round',
		deliverUrl: 'Where it lives',
		deliverNotes: 'What changed',
		deliverCta: 'Hand in',
		deliveredToast: 'Handed in.',
		acceptCta: 'Accept',
		acceptedToast: 'Accepted. The mission is delivered.',
		requestChangesCta: 'Ask for changes',
		requestChangesReason: 'What is wrong',
		requestChangesHint: 'At least twenty characters: "not quite" costs a round and teaches nothing.',
		requestedToast: 'Changes requested.',
		awaitingDecision: 'Waiting on a decision',
		decisions: {
			accepted: 'Accepted',
			changes_requested: 'Changes requested'
		},
		ratingsTitle: 'Ratings',
		ratingsBlind:
			'Nothing is readable until both sides have written, or fourteen days have passed.',
		rateCta: 'Rate',
		rateValue: 'Out of five',
		rateComment: 'Anything to add',
		ratedToast: 'Recorded, and hidden until the other side writes.',
		standingLabel: '{average} across {count} ratings',
		standingNone: 'No revealed rating yet.',
		invoicesTitle: 'Invoices',
		invoicesEmpty: 'Nothing invoiced yet.',
		invoiceAmount: 'Amount',
		invoiceCommission: 'Commission',
		payCta: 'Pay',
		applicationsTitle: 'Applications',
		applicationsEmpty: 'Nobody has applied yet.',
		verifiedAttestations: '{n} verified on Skilluv',
		declaredLinks: 'Declared links',
		acceptApplicant: 'Accept',
		rejectApplicant: 'Reject',
		rejectReason: 'Why',
		decidedToast: 'Decision recorded.'
	},

	designPlagiarism: {
		flagCta: 'Report a copy',
		flagTitle: 'Report this entry',
		flagIntro:
			'The author is told, in full, and gets a deadline to answer before anybody decides.',
		flagReason: 'What was copied',
		flagReasonHint: 'Be specific enough that somebody who has seen neither can check.',
		flagEvidence: 'Link to the original',
		flagEvidenceHint: 'Required: an accusation with nothing to look at is one nobody can check.',
		flagSubmit: 'Report',
		flaggedToast: 'Reported. The author has been told.',
		alreadyOpen: 'A case is already open on this entry.',
		caseTitle: 'Plagiarism case',
		caseNotYours: 'Only the author and the reviewers can read this case.',
		accusedLabel: 'Entry by',
		raisedByLabel: 'Raised by',
		raisedAt: 'Raised {date}',
		respondBy: 'Answer by {date}',
		windowClosed: 'The window to answer has closed.',
		respondTitle: 'Your answer',
		respondHint: 'This is read before any decision is made.',
		respondCta: 'Answer',
		respondedToast: 'Answer recorded.',
		decisionTitle: 'Decision',
		priorCases: '{n} previously upheld against this account',
		statuses: {
			open: 'Waiting on an answer',
			answered: 'Answered',
			upheld: 'Upheld',
			dismissed: 'Dismissed'
		}
	},

	designPractice: {
		title: 'Toolkit and terrains',
		subtitle: 'What designers work with, and the projects worth contributing to.',
		toolkitTitle: 'Toolkit',
		toolkitEmpty: 'Nothing curated for this domain yet.',
		accessLabel: 'What it costs to reach',
		openTool: 'Open',
		allOrientations: 'Every orientation',
		filterCategory: 'Category',
		filterAll: 'All',
		terrainsTitle: 'Where to contribute',
		terrainsSubtitle:
			'Upstream projects somebody researched as good places to start. A proposal becomes a terrain when a steward takes it.',
		terrainsEmpty: 'Nothing proposed for this domain yet.',
		whyTitle: 'Why this one',
		adopted: 'Adopted',
		adoptedOn: 'Adopted {date}',
		notAdopted: 'Shortlisted',
		notAdoptedHint: 'Nobody stewards it yet, so nothing is ingested from it.',
		openUpstream: 'Open upstream',
		openProject: 'Open on Skilluv',
		declinedReason: 'Refused: {reason}'
	},

	designFeatured: {
		title: 'Designer of the week',
		subtitle: 'Put forward by an editor, with the reason attached.',
		empty: 'Nobody put forward this week.',
		weekOf: 'Week of {date}',
		whyTitle: 'Why',
		seeProfile: 'See the profile',
		historyTitle: 'Previously',
		noPostingNote:
			'Nothing is posted anywhere from here. Whoever shares this is a person, not a schedule.'
	},

	designAwards: {
		title: 'Design Awards',
		subtitle: 'One year of work, put forward by the people who saw it.',
		editionOf: 'Edition {year}',
		noEdition: 'No edition for {year}.',
		noEditionHint: 'An edition opens when the year it covers is over.',
		statuses: {
			draft: 'Not open yet',
			nominations: 'Nominations open',
			voting: 'Vote open',
			concluded: 'Results published'
		},
		weights: '{community}% community, {jury}% jury',
		prizePerCategory: '{amount} per category',
		nominationsClose: 'Nominations close {date}',
		votingCloses: 'Vote closes {date}',
		categoriesTitle: 'Categories',
		categoryEmpty: 'Nothing put forward here yet.',
		nomineesTitle: 'Nominees',
		citationLabel: 'The case made for it',
		shortlisted: 'On the ballot',
		notShortlisted: 'Not on the ballot',
		communityVotes: '{n} community',
		juryVotes: '{n} jury',
		weightedScore: 'Weighted {n}',
		voteCta: 'Vote',
		voteJuryCta: 'Jury vote',
		votedToast: 'Vote recorded.',
		nominateTitle: 'Put work forward',
		nominateCategory: 'Category',
		nominateSubject: 'What you are nominating',
		nominateSubjectHint: 'The identifier of the person, project or deliverable the category asks for.',
		nominateCitation: 'Why it deserves it',
		nominateCitationHint: 'Required, and it is the whole nomination: voters cannot weigh a name.',
		nominateCta: 'Nominate',
		nominatedToast: 'Put forward.',
		closedNote: 'Nothing moves on this edition any more.',
		previousEditions: 'Other years'
	},

	designMentors: {
		title: 'Who could help',
		subtitle: 'Mentors in your domain, and what you have in common with each.',
		wouldHelp:
			'You have handed in a few pieces without one landing yet. That is a normal place to be, and it is the point at which a mentor helps most.',
		empty: 'Nobody to suggest yet.',
		emptyHint: 'Mentors are matched on family, tools and timezone. Fill those in and this fills up.',
		whyTitle: 'Why this person',
		craftScore: 'Craft {n}',
		activeMentees: '{n} mentees',
		timezoneGap: '{n} h apart',
		openCta: 'See the mentor'
	},

	designIterationStories: {
		title: 'Work that took some arguing',
		subtitle:
			'Three rounds or more. One critique and a fix happens to everybody; three is where a direction was questioned and somebody came back.',
		empty: 'Nothing here yet.',
		roundsTaken: '{n} rounds',
		firstVersion: 'First version',
		finalVersion: 'Where it landed',
		validatedOn: 'Validated {date}'
	}
};
