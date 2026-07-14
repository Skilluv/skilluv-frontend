<script lang="ts">
	import Modal from '$components/ui/Modal.svelte';
	import Button from '$components/ui/Button.svelte';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { LogOut } from '@lucide/svelte';

	// Petite modale de confirmation autonome — encapsule tout le flow logout
	// (appel API + redirection accueil) pour éviter de dupliquer la logique
	// dans Navbar et EnterpriseHeader.

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();

	let busy = $state(false);

	function close() {
		if (busy) return;
		open = false;
	}

	async function confirm() {
		busy = true;
		try {
			await auth.logout();
			open = false;
			goto('/');
		} finally {
			busy = false;
		}
	}
</script>

<Modal
	open={open}
	title={i18n.locale === 'fr' ? 'Se déconnecter ?' : 'Sign out?'}
	onclose={close}
>
	<div class="flex gap-4">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
			<LogOut size={20} strokeWidth={2} />
		</div>
		<p class="text-sm text-text-muted leading-relaxed">
			{i18n.locale === 'fr'
				? 'Vous serez ramené à l\'accueil et devrez vous reconnecter pour retrouver votre espace.'
				: 'You\'ll be sent back to the homepage and will need to sign in again to reach your workspace.'}
		</p>
	</div>

	{#snippet actions()}
		<Button variant="ghost" onclick={close} disabled={busy}>
			{i18n.locale === 'fr' ? 'Annuler' : 'Cancel'}
		</Button>
		<Button variant="danger" onclick={confirm} loading={busy}>
			{i18n.locale === 'fr' ? 'Se déconnecter' : 'Sign out'}
		</Button>
	{/snippet}
</Modal>
