<script lang="ts">
  import type { User } from '$lib/entities';

  interface ProfileProps {
    user: User;
  }

  const { user }: ProfileProps = $props();
</script>

<h4>个人资料</h4>
<form id="profile" action="?/profile" method="post">
  <div>
    <label for="name">姓名</label>
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
    max-width: 20rem;
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
