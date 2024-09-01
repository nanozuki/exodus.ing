<script lang="ts">
  import Account from './Account.svelte';
  import Profile from './Profile.svelte';

  const { data } = $props();
  const { user } = data;
</script>

<svelte:head>
  <title>Settings</title>
  <meta property="og:title" content="Settings" />
</svelte:head>

<h3>设置</h3>

<Profile {user} />

<Account {user} />
