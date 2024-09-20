<script lang="ts">
  const { data } = $props();
  const { user } = data;
</script>

<svelte:head>
  <title>个人资料 - Exodus</title>
  <meta property="og:title" content="设置：个人资料" />
</svelte:head>

<form id="profile" method="post">
  <div>
    <label for="name">名称</label>
    <input type="text" name="name" value={user.name} required />
  </div>
  <div>
    <label for="aboutMe">介绍（支持Markdown）</label>
    <textarea name="aboutMe" value={user.aboutMe}></textarea>
  </div>
  <button class="positive" type="submit">更新</button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
  }
  label {
    display: block;
    font-family: var(--serif);
    font-weight: bold;
  }
  input,
  textarea {
    display: block;
    width: 100%;
  }
  textarea {
    height: 4rem;
  }
</style>
