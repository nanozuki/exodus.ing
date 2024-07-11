<script lang="ts">
	let showPassword = $state(false);
	function togglePassword() {
		showPassword = !showPassword;
	}
	let passwordType = $derived(showPassword ? 'text' : 'password');
</script>

<form>
	<label for="username">Username <input type="text" /> </label>
	<label for="email">Email <input type="text" /> </label>
	<label for="password">Password <input type={passwordType} /></label>
	<button type="button" onclick={togglePassword}>View Password</button>
	<button type="submit">Register</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}
</style>
