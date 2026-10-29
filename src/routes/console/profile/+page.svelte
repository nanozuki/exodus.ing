<script lang="ts">
  import { page } from '$app/state';
  import { loadLayoutData } from '../layout.remote';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';
  import { updateProfile } from './page.remote';

  const { user } = $derived(await loadLayoutData({ pathname: page.url.pathname }));
</script>

<svelte:head>
  <title>个人资料设置 - Exodus</title>
  <meta property="og:title" content="个人资料设置" />
</svelte:head>

<form id="profile" {...updateProfile} class="gap-y-m flex flex-col">
  <Input
    {...updateProfile.fields.name.as('text', user.name)}
    label="名称"
    issues={updateProfile.fields.name.issues()}
    required
  />
  <InputTextArea
    {...updateProfile.fields.aboutMe.as('text', user.aboutMe)}
    label="介绍"
    issues={updateProfile.fields.aboutMe.issues()}
  />
  <Button variant="primary" pending={updateProfile.pending} type="submit">更新</Button>
</form>
