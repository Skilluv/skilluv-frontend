<script lang="ts">
	/**
	 * Contest entries, laid out like a design gallery rather than a table
	 * (SKI-237).
	 *
	 * CSS columns rather than a JS masonry: the browser does the packing, it
	 * reflows on resize for free, and there is no layout shift while images
	 * decode. The trade-off is reading order going down each column instead of
	 * across — acceptable for a gallery, which is browsed, not read.
	 *
	 * Note on blind review: the backend serves every entry to everyone, on
	 * purpose ("a contest whose entries cannot be read is a contest whose
	 * result cannot be questioned"). There is nothing to hide here, and this
	 * component must not pretend otherwise.
	 */
	import { ExternalLink, Heart } from '@lucide/svelte';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import FlagPlagiarism from './FlagPlagiarism.svelte';
	import type { ContestSubmission } from '$types';

	interface Props {
		submissions: ContestSubmission[];
		/** Votes per submission id, when the contest counts them. */
		votes?: Record<string, number>;
		/** The submission the reader voted for, if any. */
		votedFor?: string | null;
		/** Absent when voting is closed or the reader is signed out. */
		onvote?: (submissionId: string) => void;
		/** The reader's own entry, highlighted. */
		ownParticipantId?: string;
		/**
		 * Shows the plagiarism report action on entries that are not the
		 * reader's own. Absent when signed out: raising a case requires an
		 * account, and offering the button to somebody who cannot use it is a
		 * dead end.
		 */
		canReport?: boolean;
	}

	let {
		submissions,
		votes = {},
		votedFor = null,
		onvote,
		ownParticipantId,
		canReport = false
	}: Props = $props();

	/** An image URL renders inline; anything else gets a link. */
	function isImage(url: string): boolean {
		return /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url);
	}
</script>

<div class="columns-1 gap-5 sm:columns-2 lg:columns-3" data-testid="submission-masonry">
	{#each submissions as submission (submission.id)}
		{@const isOwn = submission.participant_id === ownParticipantId}
		{@const voteCount = votes[submission.id] ?? 0}
		<article
			class="mb-5 break-inside-avoid overflow-hidden rounded-2xl border bg-surface-elevated {isOwn
				? 'border-accent/50'
				: 'border-border'}"
		>
			{#if isImage(submission.artifact_url)}
				<a href={submission.artifact_url} target="_blank" rel="noopener noreferrer nofollow ugc">
					<img
						src={submission.artifact_url}
						alt={submission.summary}
						loading="lazy"
						class="w-full object-cover"
					/>
				</a>
			{/if}

			<div class="p-4">
				<div class="flex flex-wrap items-center gap-2">
					{#if isOwn}
						<Badge variant="accent" size="sm">{i18n.t('designContests.yourEntry')}</Badge>
					{/if}
					{#if submission.status !== 'submitted'}
						<Badge
							variant={submission.status === 'accepted' ? 'success' : 'default'}
							size="sm"
						>
							{i18n.t(`designContests.submissionStatuses.${submission.status}`)}
						</Badge>
					{/if}
				</div>

				<p class="mt-2 whitespace-pre-wrap text-sm text-text-primary">{submission.summary}</p>

				{#if submission.judge_score !== null}
					<p class="mt-2 text-xs font-semibold text-accent">
						{i18n.t('designContests.judgeScore', { n: submission.judge_score })}
					</p>
				{/if}
				{#if submission.judge_notes}
					<p class="mt-1 text-xs text-text-muted">{submission.judge_notes}</p>
				{/if}

				<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
					<div class="flex items-center gap-3 text-xs">
						<a
							href={submission.artifact_url}
							target="_blank"
							rel="noopener noreferrer nofollow ugc"
							class="inline-flex items-center gap-1 text-text-muted hover:text-text-primary"
						>
							{i18n.t('designContests.galleryOpenArtifact')}
							<ExternalLink size={11} strokeWidth={2} />
						</a>
						{#if submission.secondary_url}
							<a
								href={submission.secondary_url}
								target="_blank"
								rel="noopener noreferrer nofollow ugc"
								class="inline-flex items-center gap-1 text-text-muted hover:text-text-primary"
							>
								{i18n.t('designContests.gallerySecondary')}
								<ExternalLink size={11} strokeWidth={2} />
							</a>
						{/if}
					</div>

					{#if canReport && !isOwn}
						<FlagPlagiarism submissionId={submission.id} />
					{/if}

					{#if onvote}
						<button
							type="button"
							onclick={() => onvote?.(submission.id)}
							aria-pressed={votedFor === submission.id}
							class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-200 {votedFor ===
							submission.id
								? 'border-accent/40 bg-accent/10 text-accent'
								: 'border-border text-text-muted hover:text-text-primary'}"
						>
							<Heart size={12} strokeWidth={2} />
							{votedFor === submission.id
								? i18n.t('designContests.votedCta')
								: i18n.t('designContests.voteCta')}
							{#if voteCount > 0}
								<span class="font-mono">{voteCount}</span>
							{/if}
						</button>
					{:else if voteCount > 0}
						<span class="inline-flex items-center gap-1.5 text-xs text-text-muted">
							<Heart size={12} strokeWidth={2} />
							{i18n.t('designContests.voteCount', { n: voteCount })}
						</span>
					{/if}
				</div>
			</div>
		</article>
	{/each}
</div>
