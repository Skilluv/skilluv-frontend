<script lang="ts">
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import { authApi } from '$api/auth';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';

	let sending = $state(false);
	let dismissed = $state(false);

	async function resend() {
		sending = true;
		try {
			await authApi.resendVerification();
			toast.success(
				i18n.locale === 'fr'
					? 'Email de vérification renvoyé.'
					: 'Verification email resent.'
			);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : 'Erreur');
		} finally {
			sending = false;
		}
	}

	let visible = $derived(
		auth.isAuthenticated && auth.user && !auth.user.email_verified && !dismissed
	);
</script>

{#if visible}
	<div class="border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm">
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-3">
			<div class="min-w-0 flex-1">
				<span class="font-medium">
					{i18n.locale === 'fr' ? 'Confirme ton email' : 'Verify your email'}
				</span>
				<span class="ml-2 text-text-muted">
					{i18n.locale === 'fr'
						? 'pour débloquer toutes les fonctionnalités.'
						: 'to unlock all features.'}
				</span>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<button
					class="rounded-lg bg-warning px-3 py-1 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
					disabled={sending}
					onclick={resend}
				>
					{sending
						? i18n.locale === 'fr' ? 'Envoi…' : 'Sending…'
						: i18n.locale === 'fr' ? 'Renvoyer le mail' : 'Resend email'}
				</button>
				<button
					class="text-text-muted hover:text-text-primary"
					aria-label="Dismiss"
					onclick={() => (dismissed = true)}
				>
					✕
				</button>
			</div>
		</div>
	</div>
{/if}
