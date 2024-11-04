<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';

  const { data } = $props();
  const { user } = data;
</script>

<svelte:head>
  <title>个人资料设置 - Exodus</title>
  <meta property="og:title" content="个人资料设置" />
</svelte:head>

<form id="profile" method="post" class="flex flex-col gap-y-m">
  <Input field="name" label="名称" type="text" value={user.name} required />
  <InputTextArea field="aboutMe" label="介绍" value={user.aboutMe} />
  <Button variant="primary" type="submit">更新</Button>
</form>

<style>
  /* form { */
  /*   display: flex; */
  /*   flex-direction: column; */
  /*   row-gap: 1rem; */
  /* } */
  /* label { */
  /*   display: block; */
  /*   font-family: var(--serif); */
  /*   font-weight: bold; */
  /* } */
  /* input, */
  /* textarea { */
  /*   display: block; */
  /*   width: 100%; */
  /* } */
  /* textarea { */
  /*   height: 4rem; */
  /* } */
</style>
