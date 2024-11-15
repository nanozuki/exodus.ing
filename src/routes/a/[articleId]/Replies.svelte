<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { article, replies, user } = $derived(data);
  let replyUrl = $derived(encodeURI(`/a/new/edit?replyTo=${article.id}`));
  let authNext = $derived(encodeURIComponent(`/a/new/edit?replyTo=${article.id}`));
</script>

<div id="reply-section" class="border-t-4 border-accent flex flex-col gap-y-m">
  <h2 class="font-serif font-bold pt-1">
    回应 {#if replies.length > 0}{replies.length}{/if}
  </h2>
  {#if user}
    <div class="bg-overlay p-m flex flex-row items-center justify-between">
      <p>撰写文章回应</p>
      <Action element="a" href={replyUrl}>回应</Action>
    </div>
  {:else}
    <div class="bg-overlay p-m flex flex-row items-center justify-between">
      <p>登录后方可撰写文章回应</p>
      <Action element="a" href={`/auth?next=${authNext}`}>登录/注册</Action>
    </div>
  {/if}
</div>
