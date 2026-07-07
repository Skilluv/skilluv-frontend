<script lang="ts">
	import { goto } from '$app/navigation';
	import { communityApi } from '$api/community';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import { i18n } from '$lib/i18n';
	import type { SkillDomain } from '$types';

	let title = $state('');
	let description = $state('');
	let instructions = $state('');
	let skillDomain = $state<SkillDomain>('code');
	let difficulty = $state(2);
	let language = $state('');
	let expectedOutput = $state('');
	let durationMinutes = $state<number | undefined>(undefined);
	let submitForReview = $state(true);
	let saving = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || !description.trim() || !instructions.trim()) {
			toast.error('Remplis tous les champs obligatoires.');
			return;
		}

		saving = true;
		try {
			await communityApi.create({
				title: title.trim(),
				description: description.trim(),
				instructions: instructions.trim(),
				skill_domain: skillDomain,
				difficulty,
				language: language.trim() || undefined,
				expected_output: expectedOutput.trim() || undefined,
				duration_minutes: durationMinutes,
				submit_for_review: submitForReview
			});
			toast.success(submitForReview ? i18n.t('community.create.submitted') : i18n.t('community.create.draftSaved'));
			goto('/community/challenges/mine');
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur lors de la création.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('community.create.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12 sm:py-16">
	<a href="/community/challenges" class="mb-6 inline-block text-sm text-text-muted hover:text-text-primary">← {i18n.t('common.actions.back')}</a>
	<h1 class="mb-3 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
		{i18n.t('community.create.title')}<span class="text-accent">.</span>
	</h1>
	<p class="mb-10 text-lg text-text-muted">{i18n.t('community.create.subtitle')}</p>

	<form onsubmit={handleSubmit} class="flex flex-col gap-5">
		<Input label={i18n.t('community.create.challengeTitle')} placeholder="Un titre accrocheur" bind:value={title} required />
		<Input label={i18n.t('community.create.description')} placeholder="De quoi parle ce challenge ?" bind:value={description} required />

		<div>
			<label for="instructions" class="mb-1.5 block text-sm font-medium">{i18n.t('community.create.instructions')}</label>
			<textarea
				id="instructions"
				bind:value={instructions}
				placeholder={i18n.t('community.create.instructionsPlaceholder')}
				rows="8"
				required
				class="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
			></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="domain" class="mb-1.5 block text-sm font-medium">{i18n.t('community.create.domain')}</label>
				<Select
					items={[
						{ value: 'code', label: i18n.t('common.domains.code') },
						{ value: 'design', label: i18n.t('common.domains.design') },
						{ value: 'game', label: i18n.t('common.domains.game') },
						{ value: 'security', label: i18n.t('common.domains.security') }
					]}
					bind:value={skillDomain}
					class="w-full"
				/>
			</div>

			<div>
				<label for="difficulty" class="mb-1.5 block text-sm font-medium">{i18n.t('community.create.difficulty')} ({difficulty}/5)</label>
				<input id="difficulty" type="range" min="1" max="5" bind:value={difficulty} class="mt-3 w-full accent-accent" />
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Input label={i18n.t('community.create.language')} placeholder="javascript, python..." bind:value={language} />
			<div>
				<label for="duration" class="mb-1.5 block text-sm font-medium">{i18n.t('community.create.duration')}</label>
				<input
					id="duration"
					type="number"
					min="5"
					max="480"
					bind:value={durationMinutes}
					placeholder={i18n.t('community.create.durationPlaceholder')}
					class="h-11 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm text-text-primary"
				/>
			</div>
		</div>

		<div>
			<label for="expected" class="mb-1.5 block text-sm font-medium">{i18n.t('community.create.expectedOutput')}</label>
			<textarea
				id="expected"
				bind:value={expectedOutput}
				placeholder={i18n.t('community.create.expectedOutputPlaceholder')}
				rows="3"
				class="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
			></textarea>
		</div>

		<label class="flex items-center gap-3">
			<input type="checkbox" bind:checked={submitForReview} class="h-5 w-5 rounded accent-accent" />
			<span class="text-sm">{i18n.t('community.create.submitForReview')} ({i18n.t('community.create.submitForReviewHint')})</span>
		</label>

		<Button variant="accent" size="lg" type="submit" loading={saving} class="w-full">
			{saving ? i18n.t('community.create.creating') : submitForReview ? i18n.t('community.create.submitBtn') : i18n.t('community.create.saveDraft')}
		</Button>
	</form>
</div>
