<script lang="ts">
  const { data } = $props();
  const { user } = data;

  let name = $state(user.name);
  let aboutMe = $state(user.aboutMe);
  let username = $state(user.username);
</script>

<svelte:head>
  <title>Settings</title>
  <meta property="og:title" content="Settings" />
</svelte:head>

<h3>设置</h3>

<h4>个人资料</h4>
<form id="profile" action="?/profile" method="post">
  <div>
    <label for="name">姓名</label>
    <input type="text" name="name" bind:value={name} required />
  </div>
  <div>
    <label for="aboutMe">介绍（支持Markdown）</label>
    <textarea name="aboutMe" bind:value={aboutMe}></textarea>
  </div>
  <button class="positive" type="submit">更新</button>
</form>

<h4>账户</h4>
<form action="?account/username" method="post">
  <label for="username">用户名</label>
  <input type="text" name="username" bind:value={username} />
  {#if user.username !== username}
    <button type="submit">更新</button>
  {/if}
</form>
<div>
  <p>GitHub ID</p>
  <p>github.com/</p>
</div>

<style>
  form#profile {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
    max-width: 20rem;
  }
  label {
    display: block;
  }
  input,
  textarea {
    display: block;
    width: 100%;
  }
  textarea {
    resize: vertical;
    height: 3rem;
  }
</style>
