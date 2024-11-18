<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { article, replies, user } = $derived(data);
  let replyUrl = $derived(encodeURI(`/a/new/edit?replyTo=${article.id}`));
  let authNext = $derived(encodeURIComponent(`/a/new/edit?replyTo=${article.id}`));
</script>

<div id="reply-section" class="border-t-4 border-accent flex flex-col gap-y-m">
  <h2 class="font-serif font-bold pt-1">回应</h2>
  {#if user}
    <div class="bg-overlay p-m flex flex-row items-center justify-between">
      <p>撰文回应此文章</p>
      <Action element="a" href={replyUrl}><MdiReplyOutline />回应</Action>
    </div>
  {:else}
    <div class="bg-overlay p-m flex flex-row items-center justify-between">
      <p>登录后方可撰写文章回应</p>
      <Action element="a" href={`/auth?next=${authNext}`}>登录/注册</Action>
    </div>
  {/if}
  <h6 class="font-bold pt-1">
    回应文章 {#if replies.length > 0}{replies.length}{/if}
  </h6>
  <div class="flex flex-col gap-y-m">
    {#each replies as reply (reply.id)}
      <p class="bg-overlay py-xs px-s">
        <a class="font-serif font-bold text-2xl hover:text-primary" href={`/u/${article.authorUsername}`}>
          {reply.title}
        </a>
        <a class="font-semibold text-accent hover:text-accent-alt ml-2" href={`/a/${article.id}`}>
          {reply.authorName}
        </a>
      </p>
    {/each}
  </div>
</div>
