<script lang="ts">
	// Candidate workspace security settings — TOTP, backup codes, passkeys,
	// active sessions. The form itself lives in
	// `$lib/components/settings/SecurityForm.svelte` so the enterprise
	// workspace can reuse it under its own layout without duplication.
	//
	// The `hooks.server.ts` role gate ensures only candidate accounts
	// (role='user' or admin) actually land on this route — an enterprise or
	// recruiter is bounced to `/enterprise/settings/security` instead.
	import SecurityForm from '$lib/components/settings/SecurityForm.svelte';
	import LinkedAccounts from '$lib/components/settings/LinkedAccounts.svelte';
</script>

<SecurityForm />

<!-- The identity providers on this account. Here rather than on the profile
     page because unlinking one can be the act that locks somebody out, and
     that belongs next to passwords and passkeys. -->
<div class="mx-auto max-w-3xl px-4 pb-8">
	<LinkedAccounts />
</div>
