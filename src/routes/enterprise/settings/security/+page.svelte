<script lang="ts">
	// Enterprise workspace security settings — TOTP, backup codes, passkeys,
	// active sessions. Same form as the candidate `/settings/security` route,
	// but rendered inside the enterprise layout (EnterpriseHeader + sidebar)
	// so recruiters and owners never leave their workspace to arm their 2FA.
	import SecurityForm from '$lib/components/settings/SecurityForm.svelte';
</script>

<SecurityForm showBack={false} />
