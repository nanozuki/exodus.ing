<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import Form from '$lib/component/Form.svelte';
  import Input from '$lib/component/Input.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';

  const { data } = $props();
  const { user } = $derived(data);
</script>

<svelte:head>
  <title>个人资料设置 - Exodus</title>
  <meta property="og:title" content="个人资料设置" />
</svelte:head>

<Form id="profile" method="post" class="gap-y-m flex flex-col">
  <Input name="name" label="名称" type="text" value={user.name} required />
  <InputTextArea name="aboutMe" label="介绍" value={user.aboutMe} />
  <Button variant="primary" type="submit">更新</Button>
</Form>
