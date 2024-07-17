<form>
	<h2>注册</h2>
	<label for="inviteCode">邀请码</label>
	<input name="inviteCode" type="text" />
	<!-- <a href="/auth/github">Sign in with GitHub</a> -->
	<button id="register" class="positive" type="submit">注册</button>
</form>
<div class="separator"></div>
<form>
	<h2>登录</h2>
	<!-- <a href="/auth/github">Sign in with GitHub</a> -->
	<button id="login" class="positive" type="submit">登录</button>
</form>

<style>
	div.separator {
		margin: 1rem 0;
		border-top: 1px solid var(--border-color);
	}
</style>
