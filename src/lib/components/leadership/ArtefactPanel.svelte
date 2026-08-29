<script lang="ts">
	/**
	 * A leadership artefact's redaction state and its reach.
	 *
	 * Both halves of what makes this domain's evidence mean anything, on the
	 * slice they are about.
	 *
	 * ## Redaction is two acts by two people
	 *
	 * The author *declares* an artefact anonymised; a reviewer *confirms* it.
	 * One person doing both would make an anonymisation self-certifying, and
	 * the whole point is that somebody else read it and recognised nobody.
	 *
	 * So the two buttons never appear together for the same reader: the author
	 * gets declare, a reviewer gets confirm, and the confirm call answers 403
	 * for anybody without the capability — which is the authority, not a role
	 * check here.
	 *
	 * ## An unacknowledged link is a claim about somebody else's project
	 *
	 * Anybody can point their delivery plan at any project. What makes it reach
	 * is somebody on that project agreeing it applied to them, which is what
	 * `acknowledged_at` records. Rendering the two alike would let anybody
	 * attach themselves to any work, so the pending ones say so.
	 *
	 * Acknowledging is guarded by nothing except not being the author. A
	 * capability gate would mean a plan could only be agreed to by people
	 * senior enough to hold one, and that is not who agrees to plans.
	 */
	import { onMount } from 'svelte';
	import { Link2, ShieldCheck } from '@lucide/svelte';
	import { leadershipApi, type ArtifactLink } from '$api/leadership';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		sliceId: string;
		/** The author sees declare; everybody else may see confirm. */
		isMine?: boolean;
	}

	let { sliceId, isMine = false }: Props = $props();

	let links = $state<ArtifactLink[]>([]);
	let loading = $state(true);
	let busy = $state<Record<string, boolean>>({});

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}

	async function load() {
		loading = true;
		try {
			const res = await leadershipApi.links(sliceId);
			// `reach` is the envelope; the shape below it is the backend's, and
			// only the list of links is read here.
			const reach = res.data?.reach as { links?: ArtifactLink[] } | ArtifactLink[] | undefined;
			links = Array.isArray(reach) ? reach : (reach?.links ?? []);
		} catch {
			// A slice with no leadership trade answers 404, which is an answer.
			links = [];
		} finally {
			loading = false;
		}
	}

	async function run(key: string, fn: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await fn();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}
	onMount(load);
</script>


{#if loading}
		<Skeleton class="h-20 w-full" rounded="xl" />
	{:else if links.length > 0 || isMine}
		<section class="space-y-3" data-testid="leadership-artefact">
			<h3 class="flex items-center gap-2 text-sm font-bold text-text">
				<Link2 size={16} />
				{i18n.t('leadershipArtefact.title')}
			</h3>

			{#if links.length > 0}
				<ul class="space-y-2">
					{#each links as l (l.id)}
						<li class="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm">
							<span class="min-w-0 flex-1 text-text">{l.link_kind}</span>
							{#if l.note}
								<span class="text-xs text-text-muted">{l.note}</span>
							{/if}
							<!-- Agreed, or claimed. Rendering both alike would let anybody
							     attach themselves to any project. -->
							{#if l.acknowledged_at}
								<Badge size="sm" variant="success">
									{i18n.t('leadershipArtefact.acknowledged', { date: fmtDate(l.acknowledged_at) })}
								</Badge>
							{:else}
								<Badge size="sm" variant="warning">
									{i18n.t('leadershipArtefact.pending')}
								</Badge>
								{#if !isMine}
									<!-- Open to anybody who is not the author. The server
									     decides; this only offers. -->
									<Button
										size="sm"
										variant="ghost"
										loading={busy[l.id]}
										onclick={() =>
											run(
												l.id,
												() => leadershipApi.acknowledgeLink(l.id),
												i18n.t('leadershipArtefact.acknowledgedToast')
											)}
										data-testid="acknowledge-link"
									>
										{i18n.t('leadershipArtefact.acknowledgeCta')}
									</Button>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<div class="flex flex-wrap gap-2">
				{#if isMine}
					<!-- The author's half. The other half is somebody else's. -->
					<Button
						size="sm"
						variant="ghost"
						loading={busy.declare}
						onclick={() =>
							run(
								'declare',
								() => leadershipApi.declareRedaction(sliceId),
								i18n.t('leadershipArtefact.declaredToast')
							)}
					>
						<ShieldCheck size={15} />
						{i18n.t('leadershipArtefact.declareCta')}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						loading={busy.adoption}
						onclick={() =>
							run(
								'adoption',
								() => leadershipApi.recordAdoption(sliceId),
								i18n.t('leadershipArtefact.adoptionToast')
							)}
					>
						{i18n.t('leadershipArtefact.adoptionCta')}
					</Button>
				{:else}
					<!-- Offered to everybody and refused with a 403 without the
					     capability. The server is the authority on who reviews. -->
					<Button
						size="sm"
						variant="ghost"
						loading={busy.confirm}
						onclick={() =>
							run(
								'confirm',
								() => leadershipApi.confirmRedaction(sliceId),
								i18n.t('leadershipArtefact.confirmedToast')
							)}
						data-testid="confirm-redaction"
					>
						<ShieldCheck size={15} />
						{i18n.t('leadershipArtefact.confirmCta')}
					</Button>
				{/if}
			</div>

			<p class="text-xs text-text-muted">{i18n.t('leadershipArtefact.redactionNote')}</p>
		</section>
	{/if}
