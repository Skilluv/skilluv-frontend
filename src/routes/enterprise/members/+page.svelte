<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { enterpriseApi } from '$api/enterprise';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Input from '$components/ui/Input.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import StatCard from '$components/ui/StatCard.svelte';
	import Table from '$components/ui/Table.svelte';

	interface Member {
		id: string;
		user_id: string;
		username: string;
		display_name: string;
		email: string;
		role: string;
		status: string;
		invited_at: string;
		accepted_at: string | null;
	}

	let members = $state<Member[]>([]);
	let loading = $state(true);
	let inviteOpen = $state(false);
	let inviteEmail = $state('');
	let inviting = $state(false);
	let inviteError = $state('');
	let lastInviteToken = $state<string | null>(null);

	let activeCount = $derived(members.filter((m) => m.status === 'active').length);
	let pendingCount = $derived(members.filter((m) => m.status === 'pending').length);
	let ownerCount = $derived(members.filter((m) => m.role === 'owner').length);

	let activeMembers = $derived(members.filter((m) => m.status === 'active'));
	let pendingMembers = $derived(members.filter((m) => m.status === 'pending'));

	// Le user connecté est-il l'owner ?
	let isOwner = $derived(
		members.some((m) => m.user_id === auth.user?.id && m.role === 'owner' && m.status === 'active')
	);

	async function load() {
		loading = true;
		try {
			const res = await enterpriseApi.members();
			members = res.data.members;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function sendInvite(e: SubmitEvent) {
		e.preventDefault();
		if (!inviteEmail.trim() || inviting) return;
		inviting = true;
		inviteError = '';
		try {
			const res = await enterpriseApi.invite(inviteEmail.trim());
			lastInviteToken = res.data.invite_token;
			toast.success(i18n.locale === 'fr' ? 'Invitation envoyée' : 'Invitation sent');
			inviteEmail = '';
			await load();
		} catch (e) {
			inviteError = e instanceof SkilluError ? e.message : 'Erreur';
		} finally {
			inviting = false;
		}
	}

	async function revoke(userId: string, username: string) {
		if (
			!confirm(
				i18n.locale === 'fr'
					? `Retirer @${username} de l'entreprise ?`
					: `Remove @${username} from the enterprise?`
			)
		)
			return;
		try {
			await enterpriseApi.removeMember(userId);
			toast.success(i18n.locale === 'fr' ? 'Membre retiré' : 'Member removed');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		}
	}

	function copyInviteLink() {
		if (!lastInviteToken) return;
		const url = `${window.location.origin}/enterprise/invite/accept?token=${lastInviteToken}`;
		void navigator.clipboard.writeText(url);
		toast.success(i18n.locale === 'fr' ? 'Lien copié' : 'Link copied');
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	}

	function roleMeta(role: string): { label: string; variant: 'primary' | 'accent' | 'default' } {
		if (role === 'owner') return { label: 'Owner', variant: 'accent' };
		return { label: i18n.locale === 'fr' ? 'Recruteur' : 'Recruiter', variant: 'primary' };
	}

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Membres — Skilluv' : 'Members — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10 sm:py-14">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-3">
				{i18n.locale === 'fr' ? 'Membres' : 'Members'}<span class="text-accent">.</span>
			</h1>
			<p class="text-base sm:text-lg text-text-muted max-w-2xl">
				{i18n.locale === 'fr'
					? "Gérez les recruteurs qui accèdent à votre espace entreprise. L'owner peut inviter et révoquer."
					: 'Manage the recruiters that access your enterprise space. Owner can invite and revoke.'}
			</p>
		</div>
		{#if isOwner}
			<Button variant="accent" onclick={() => (inviteOpen = true)}>
				+ {i18n.locale === 'fr' ? 'Inviter un recruteur' : 'Invite a recruiter'}
			</Button>
		{/if}
	</div>

	<!-- Stats -->
	<div class="grid gap-3 sm:grid-cols-3 mb-8">
		<StatCard
			label={i18n.locale === 'fr' ? 'Membres actifs' : 'Active members'}
			value={activeCount}
			color="primary"
		/>
		<StatCard
			label={i18n.locale === 'fr' ? 'Invitations en attente' : 'Pending invitations'}
			value={pendingCount}
			color="accent"
		/>
		<StatCard
			label={i18n.locale === 'fr' ? 'Owners' : 'Owners'}
			value={ownerCount}
			color="success"
		/>
	</div>

	{#if loading}
		<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-64"></div>
	{:else}
		<!-- Active members -->
		<section class="mb-10">
			<h2 class="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
				{i18n.locale === 'fr' ? 'Membres actifs' : 'Active members'}
			</h2>
			<Table
				columns={[
					{ key: 'user', label: i18n.locale === 'fr' ? 'Utilisateur' : 'User' },
					{ key: 'email', label: 'Email' },
					{ key: 'role', label: i18n.locale === 'fr' ? 'Rôle' : 'Role' },
					{ key: 'accepted_at', label: i18n.locale === 'fr' ? 'Membre depuis' : 'Member since' },
					{ key: 'actions', label: '', align: 'right' }
				]}
				rows={activeMembers.map((m) => ({ __raw: m }))}
				emptyLabel={i18n.locale === 'fr' ? 'Aucun membre actif' : 'No active members'}
			>
				{#snippet cell(row, col)}
					{@const m = row.__raw as Member}
					{@const meta = roleMeta(m.role)}
					{#if col.key === 'user'}
						<div class="flex items-center gap-3">
							<div
								class="flex h-9 w-9 items-center justify-center rounded-full bg-surface-overlay text-sm font-bold text-primary"
							>
								{m.display_name?.[0]?.toUpperCase() ?? '?'}
							</div>
							<div>
								<p class="font-semibold text-text-primary">{m.display_name}</p>
								<p class="text-xs text-text-muted font-mono">@{m.username}</p>
							</div>
						</div>
					{:else if col.key === 'email'}
						<span class="text-text-muted">{m.email}</span>
					{:else if col.key === 'role'}
						<Badge variant={meta.variant} size="sm">{meta.label}</Badge>
					{:else if col.key === 'accepted_at'}
						<span class="text-text-muted text-xs">
							{m.accepted_at ? fmtDate(m.accepted_at) : '—'}
						</span>
					{:else if col.key === 'actions'}
						{#if isOwner && m.role !== 'owner'}
							<button
								onclick={() => revoke(m.user_id, m.username)}
								class="text-xs font-semibold text-error hover:underline"
							>
								{i18n.locale === 'fr' ? 'Retirer' : 'Remove'}
							</button>
						{/if}
					{/if}
				{/snippet}
			</Table>
		</section>

		<!-- Pending invitations -->
		{#if pendingMembers.length > 0}
			<section>
				<h2 class="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
					{i18n.locale === 'fr' ? 'Invitations en attente' : 'Pending invitations'}
				</h2>
				<Table
					columns={[
						{ key: 'email', label: 'Email' },
						{ key: 'invited_at', label: i18n.locale === 'fr' ? 'Invité le' : 'Invited on' },
						{ key: 'status', label: 'Statut' },
						{ key: 'actions', label: '', align: 'right' }
					]}
					rows={pendingMembers.map((m) => ({ __raw: m }))}
					emptyLabel={i18n.locale === 'fr' ? 'Aucune invitation en attente' : 'No pending invitations'}
				>
					{#snippet cell(row, col)}
						{@const m = row.__raw as Member}
						{#if col.key === 'email'}
							<span class="text-text-primary">{m.email}</span>
						{:else if col.key === 'invited_at'}
							<span class="text-text-muted text-xs">{fmtDate(m.invited_at)}</span>
						{:else if col.key === 'status'}
							<Badge variant="warning" size="sm">
								{i18n.locale === 'fr' ? 'En attente' : 'Pending'}
							</Badge>
						{:else if col.key === 'actions'}
							{#if isOwner}
								<button
									onclick={() => revoke(m.user_id, m.username)}
									class="text-xs font-semibold text-error hover:underline"
								>
									{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
								</button>
							{/if}
						{/if}
					{/snippet}
				</Table>
			</section>
		{/if}
	{/if}
</div>

<!-- Invite modal -->
<Modal
	open={inviteOpen}
	title={i18n.locale === 'fr' ? 'Inviter un recruteur' : 'Invite a recruiter'}
	onclose={() => {
		inviteOpen = false;
		lastInviteToken = null;
		inviteError = '';
	}}
>
	<div class="space-y-4">
		<p class="text-sm text-text-muted">
			{i18n.locale === 'fr'
				? "Entrez l'email du recruteur à inviter. Un lien d'invitation sera généré à lui transmettre."
				: 'Enter the recruiter email to invite. An invitation link will be generated for you to share.'}
		</p>

		<form onsubmit={sendInvite} class="space-y-4">
			<Input
				label="Email"
				type="email"
				placeholder="recruteur@entreprise.com"
				bind:value={inviteEmail}
				error={inviteError}
				required
			/>

			<Button variant="accent" type="submit" loading={inviting} class="w-full">
				{i18n.locale === 'fr' ? "Envoyer l'invitation" : 'Send invitation'}
			</Button>
		</form>

		{#if lastInviteToken}
			<div class="rounded-2xl border border-success/40 bg-success/5 p-4">
				<p class="mb-2 text-xs font-bold uppercase tracking-widest text-success">
					{i18n.locale === 'fr' ? 'Lien généré' : 'Link generated'}
				</p>
				<p class="text-xs text-text-muted mb-3 leading-relaxed">
					{i18n.locale === 'fr'
						? "Partagez ce lien avec le recruteur invité. Il pourra l'accepter en un clic."
						: 'Share this link with the invited recruiter. They can accept in one click.'}
				</p>
				<div class="flex items-center gap-2">
					<code class="flex-1 truncate rounded-lg bg-surface-overlay px-3 py-2 text-xs font-mono text-text-primary">
						/enterprise/invite/accept?token={lastInviteToken.slice(0, 12)}…
					</code>
					<Button variant="secondary" size="sm" onclick={copyInviteLink}>
						{i18n.locale === 'fr' ? 'Copier' : 'Copy'}
					</Button>
				</div>
			</div>
		{/if}
	</div>
</Modal>
