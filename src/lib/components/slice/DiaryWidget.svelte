<script lang="ts">
	import { slicesApi, type DiaryEntry } from '$api/slices';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';

	interface Props {
		sliceId: string;
		canPost: boolean;
	}

	let { sliceId, canPost }: Props = $props();

	let loading = $state(true);
	let entries = $state<DiaryEntry[]>([]);
	let error = $state('');

	let body = $state('');
	let isPublic = $state(true);
	let posting = $state(false);

	$effect(() => {
		void sliceId;
		load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await slicesApi.diary(sliceId);
			entries = res.data.entries;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('p26.validatorApplication.toastError');
		} finally {
			loading = false;
		}
	}

	async function submit(e: Event) {
		e.preventDefault();
		if (!body.trim() || posting) return;
		posting = true;
		try {
			const res = await slicesApi.postDiaryEntry(sliceId, {
				body_markdown: body,
				is_public: isPublic
			});
			entries = [res.data, ...entries];
			body = '';
			toast.success(i18n.t('p26.slice.widgets.diaryToastPublished'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.slice.widgets.diaryToastError'));
		} finally {
			posting = false;
		}
	}

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString('fr-FR', {
				day: 'numeric',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function initials(name: string): string {
		return name.split(/\s+/).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2);
	}
</script>

<section class="rounded-2xl border border-border bg-surface-elevated p-5">
	<h2 class="text-lg font-semibold text-text-primary mb-4">{i18n.t('p26.slice.widgets.diaryTitle')}</h2>

	{#if canPost}
		<form onsubmit={submit} class="mb-6 space-y-3">
			<textarea
				bind:value={body}
				rows="3"
				placeholder={i18n.t('p26.slice.widgets.diaryTextareaPh')}
				class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary resize-y"
			></textarea>
			<div class="flex items-center justify-between gap-3 flex-wrap">
				<label class="inline-flex items-center gap-2 text-xs text-text-muted cursor-pointer">
					<input type="checkbox" bind:checked={isPublic} class="rounded border-border" />
					<span>{i18n.t('p26.slice.widgets.diaryPublicLabel')}</span>
				</label>
				<Button
					type="submit"
					variant="primary"
					size="sm"
					disabled={!body.trim() || posting}
					loading={posting}
				>
					{i18n.t('p26.slice.widgets.diaryPublishBtn')}
				</Button>
			</div>
		</form>
	{/if}

	{#if loading}
		<div class="space-y-3">
			<Skeleton class="h-16 w-full" rounded="xl" />
			<Skeleton class="h-16 w-full" rounded="xl" />
		</div>
	{:else if error}
		<p class="text-sm text-text-muted">{error}</p>
	{:else if entries.length === 0}
		<p class="text-sm text-text-muted">{i18n.t('p26.slice.widgets.diaryEmpty')}</p>
	{:else}
		<ul class="space-y-4">
			{#each entries as e (e.id)}
				<li class="rounded-xl border border-border/60 bg-surface p-4">
					<div class="flex items-center justify-between gap-3 mb-2">
						<div class="flex items-center gap-2 min-w-0">
							<span
								class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-overlay text-[10px] font-semibold text-text-primary overflow-hidden shrink-0"
							>
								{#if e.author_avatar_url}
									<img src={e.author_avatar_url} alt={e.author_display_name} width="28" height="28" loading="lazy" class="h-full w-full object-cover" />
								{:else}
									{initials(e.author_display_name || e.author_username)}
								{/if}
							</span>
							<a href={`/profile/${e.author_username}`} class="text-sm font-medium text-text-primary hover:text-accent truncate">
								{e.author_display_name || e.author_username}
							</a>
							<span class="text-xs text-text-muted shrink-0">{fmtDate(e.created_at)}</span>
						</div>
						{#if e.is_public}
							<Badge variant="default">{i18n.t('p26.slice.widgets.diaryPublicBadge')}</Badge>
						{:else}
							<Badge variant="warning">{i18n.t('p26.slice.widgets.diaryPrivateBadge')}</Badge>
						{/if}
					</div>
					<div class="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
						{e.body_markdown}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
