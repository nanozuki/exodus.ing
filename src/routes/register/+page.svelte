<script lang="ts">
	import { enhance } from '$app/forms';
	import ToggleEye from './ToggleEye.svelte';

	let passwordType = $state<'password' | 'text'>('password');
	let username = $state('');
	let name = $state('');
	let password = $state('');
	let inviteCode = $state('');
	let errorMsg = $state<string | undefined>(undefined);

	function onchange(open: boolean) {
		passwordType = open ? 'text' : 'password';
	}
</script>

<svelte:head>
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<form method="POST" use:enhance>
	<label for="username">账户名</label>
	<input name="username" type="text" bind:value={username} required />
	<label for="name">名称</label>
	<input name="name" type="text" bind:value={name} required />
	<label for="password">密码</label>
	<input name="password" type={passwordType} bind:value={password} required />
	<ToggleEye init={false} {onchange} />
	<label for="inviteCode">邀请码</label>
	<input name="inviteCode" type="text" bind:value={inviteCode} required />
	<small class:error={errorMsg}>
		{errorMsg || '帐户名至少三位，可包含小写字母、数字、“-”和“_”，且以小写字母开头。'}
	</small>
	<div class="cf-turnstile" data-sitekey="1x00000000000000000000AA"></div>
	<button id="register" class="positive" type="submit">Register</button>
</form>

<style>
	form {
		display: grid;
		grid-template: repeat(5, max-content) / max-content 1fr 2rem;
		gap: 0.5rem;
		padding: 2rem 0;
		align-items: center;
		max-width: 24rem;
	}
	form input {
		grid-column: 2 / span 2;
	}
	form input[name='password'] {
		grid-column: 2 / span 1;
	}
	button#register,
	small,
	div.cf-turnstile {
		grid-column: 1 / span 3;
	}
	small.error {
		color: var(--red);
	}
</style>
