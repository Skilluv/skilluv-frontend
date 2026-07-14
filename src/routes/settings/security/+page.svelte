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
</script>

<SecurityForm />
