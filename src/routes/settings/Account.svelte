<script lang="ts">
  import type { User } from '$lib/entities';

  interface AccountProps {
    user: User;
  }

  const { user }: AccountProps = $props();
</script>

<h4>账户</h4>
<div id="account-setting">
  <div class="group">
    <p class="label">用户名</p>
    <div class="value">
      <p>{user.username}</p>
      <button type="submit">编辑</button>
    </div>
  </div>
  <div class="group">
    <p class="label">GitHub ID</p>
    <div class="value">
      <p>{user.githubId}</p>
    </div>
  </div>
</div>

<style>
  #account-setting {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
  }
  .label {
    font-weight: bold;
  }
  .group {
    p {
      margin: 0;
    }
  }
  .value {
    display: flex;
    column-gap: 1rem;
    align-items: center;
  }
</style>
