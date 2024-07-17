<script lang="ts">
	import { enhance } from '$app/forms';
	let inviteCode = $state('');
	let { form } = $props();
</script>

<h2>注册</h2>
<p>获得邀请方可注册。</p>
<form id="register" method="POST" action="?/register" use:enhance>
	<label for="inviteCode">邀请码</label>
	<input name="inviteCode" type="text" bind:value={inviteCode} required />
	<small class="error">{form?.error.inviteCode}</small>
	<button id="register" class="positive" type="submit">使用 GitHub 注册</button>
</form>

<div class="separator"></div>

<h2>登录</h2>
<form id="login" method="POST" action="?/login">
	<button id="login" class="positive" type="submit">使用 GitHub 登陆</button>
</form>

<style>
	div.separator {
		margin: 1rem 0;
		border-top: 1px solid var(--border-color);
	}
	form#register {
		display: grid;
		grid-template:
			'label input' auto
			'error error' auto
			'submit submit' auto / auto 1fr;
		gap: 0.5rem;
		align-items: center;
	}
	form#register label {
		grid-area: label;
	}
	form#register input {
		grid-area: input;
	}
	form#register small.error {
		grid-area: error;
		color: var(--red);
	}
	form#register button {
		grid-area: submit;
	}
	form button {
		width: 100%;
		background-color: var(--primary-fg);
	}
	@media (min-width: 43rem) {
		form {
			max-width: 20rem;
		}
	}
</style>
