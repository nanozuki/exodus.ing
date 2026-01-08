<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';
  import type { RemoteFormIssue } from '@sveltejs/kit';
  import { updateProfile } from '$remotes/users.remote';
  import { FormState } from '$lib/rune/FormState.svelte.js';

  const { data } = $props();
  const { user } = $derived(data);

  const formState = new FormState(updateProfile);
  const getIssuesMessage = (issues: RemoteFormIssue[] | undefined) => {
    if (!issues || issues.length === 0) {
      return undefined;
    }
    return issues.map((issue) => issue.message).join(', ');
  };
</script>

<svelte:head>
  <title>个人资料设置 - Exodus</title>
  <meta property="og:title" content="个人资料设置" />
</svelte:head>

<form id="profile" {...formState.props} class="gap-y-m flex flex-col">
  <Input name="name" label="名称" type="text" value={user.name} issues={updateProfile.fields.name.issues()} required />
  <InputTextArea
    name="aboutMe"
    label="介绍"
    value={user.aboutMe}
    error={getIssuesMessage(updateProfile.fields.aboutMe.issues())}
  />
  {#if formState.error}
    <p class="text-error">{formState.error}</p>
  {/if}
  <Button variant="primary" pending={updateProfile.pending} type="submit">更新</Button>
</form>
