<script lang="ts">
	/**
	 * Create a goal (SKI-38).
	 *
	 * The target field changes shape with the kind, because the four kinds do
	 * not take the same input: a rank is a closed list, a skill level needs a
	 * skill and a number, a capability is a closed list, a count is free.
	 * `apprenti` is absent from the rank list on purpose — it is granted at
	 * signup, so the backend rejects it as a no-op goal.
	 */
	import { onMount } from 'svelte';
	import { goalsApi } from '$lib/api/goals';
	import { skillsApi, type SkillCatalogEntry } from '$lib/api/skills';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Select from '$components/ui/Select.svelte';
	import { GOAL_KINDS, type Capability, type GoalKind, type GoalProgress, type Rank } from '$types';

	interface Props {
		open: boolean;
		onclose: () => void;
		oncreated: (goal: GoalProgress) => void;
	}

	let { open, onclose, oncreated }: Props = $props();

	/** Ranks a goal may target: everything above the one granted at signup. */
	const TARGETABLE_RANKS: Rank[] = ['ranger', 'artisan', 'maitre', 'doyen'];

	/** Capabilities a member earns through their own work, not by being staff. */
	const TARGETABLE_CAPABILITIES: Capability[] = [
		'challenger',
		'mentor',
		'project_steward',
		'pr_reviewer',
		'bounty_funder',
		'issue_proposer',
		'jury_tournament',
		'community_curator',
		'forum_moderator'
	];

	let kind = $state<GoalKind>('rank');
	let rankTarget = $state<Rank>('ranger');
	let capabilityTarget = $state<Capability>('mentor');
	let skillId = $state('');
	let skillLevel = $state('3');
	let artifactCount = $state('10');
	let deadline = $state('');
	let submitting = $state(false);
	let skills = $state<SkillCatalogEntry[]>([]);

	let kindItems = $derived(
		GOAL_KINDS.map((k) => ({ value: k, label: i18n.t(`goals.kinds.${k}`) }))
	);
	let rankItems = $derived(
		TARGETABLE_RANKS.map((r) => ({ value: r, label: i18n.t(`common.titles.${r}`) }))
	);
	let capabilityItems = $derived(
		TARGETABLE_CAPABILITIES.map((c) => ({
			value: c,
			label: i18n.t(`capabilities.items.${c}.label`)
		}))
	);
	let skillItems = $derived(
		skills.map((s) => ({ value: s.id, label: s.display_name }))
	);
	let levelItems = $derived(
		[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: i18n.t('skillTree.levelLabel', { n }) }))
	);

	/** Tomorrow, in the `YYYY-MM-DD` shape the date input wants. */
	let minDeadline = $derived.by(() => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return d.toISOString().slice(0, 10);
	});

	let canSubmit = $derived.by(() => {
		if (kind === 'skill_level') return skillId !== '';
		if (kind === 'artifact_count') return Number(artifactCount) > 0;
		return true;
	});

	onMount(async () => {
		try {
			const res = await skillsApi.list();
			skills = res.data?.skills ?? [];
			if (!skillId && skills.length > 0) skillId = skills[0].id;
		} catch {
			// Without the catalogue the skill_level kind cannot be filled in;
			// the other three stay usable, so this is not a blocking failure.
		}
	});

	function targetValue(): string {
		switch (kind) {
			case 'rank':
				return rankTarget;
			case 'capability':
				return capabilityTarget;
			case 'skill_level':
				return skillLevel;
			default:
				return artifactCount;
		}
	}

	async function submit() {
		submitting = true;
		try {
			const res = await goalsApi.create({
				kind,
				target_value: targetValue(),
				target_skill_id: kind === 'skill_level' ? skillId : undefined,
				deadline: deadline || undefined
			});
			toast.success(i18n.t('goals.createdToast'));
			oncreated(res.data.goal);
			reset();
			onclose();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	function reset() {
		kind = 'rank';
		rankTarget = 'ranger';
		capabilityTarget = 'mentor';
		skillLevel = '3';
		artifactCount = '10';
		deadline = '';
	}
</script>

<Modal {open} title={i18n.t('goals.formTitle')} {onclose} size="md">
	<div class="space-y-4" data-testid="goal-form">
		<div>
			<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
				{i18n.t('goals.formKind')}
			</span>
			<Select items={kindItems} value={kind} onchange={(v) => (kind = v)} shape="rounded" />
			<p class="mt-1.5 text-xs text-text-muted">{i18n.t(`goals.kindHints.${kind}`)}</p>
		</div>

		{#if kind === 'rank'}
			<div>
				<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('goals.formTargetValue')}
				</span>
				<Select
					items={rankItems}
					value={rankTarget}
					onchange={(v) => (rankTarget = v)}
					shape="rounded"
				/>
			</div>
		{:else if kind === 'capability'}
			<div>
				<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('goals.formTargetValue')}
				</span>
				<Select
					items={capabilityItems}
					value={capabilityTarget}
					onchange={(v) => (capabilityTarget = v)}
					shape="rounded"
					searchable
				/>
			</div>
		{:else if kind === 'skill_level'}
			<div>
				<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('goals.formTargetSkill')}
				</span>
				<Select
					items={skillItems}
					value={skillId}
					onchange={(v) => (skillId = v)}
					shape="rounded"
					searchable
					placeholder={i18n.t('goals.formTargetSkill')}
				/>
			</div>
			<div>
				<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('goals.formTargetValue')}
				</span>
				<Select
					items={levelItems}
					value={skillLevel}
					onchange={(v) => (skillLevel = v)}
					shape="rounded"
				/>
			</div>
		{:else}
			<Input
				label={i18n.t('goals.formTargetValue')}
				type="number"
				min="1"
				bind:value={artifactCount}
			/>
		{/if}

		<Input
			label={i18n.t('goals.formDeadline')}
			type="date"
			min={minDeadline}
			hint={i18n.t('goals.formDeadlineHint')}
			bind:value={deadline}
		/>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={onclose}>{i18n.t('common.actions.cancel')}</Button>
		<Button variant="accent" loading={submitting} disabled={!canSubmit} onclick={submit}>
			{i18n.t('goals.formSubmit')}
		</Button>
	{/snippet}
</Modal>
