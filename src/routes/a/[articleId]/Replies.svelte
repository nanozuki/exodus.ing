<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import type { PageData } from './$types';
  import { consoleRoutes } from '../../console/routes';

  let { data }: { data: PageData } = $props();
  let { article, replies, user, canReply } = $derived(data);
  let replyUrl = $derived(encodeURI(`/a/new/edit?replyTo=${article.id}`));
  let authNext = $derived(encodeURIComponent(`/a/new/edit?replyTo=${article.id}`));
</script>

<div id="reply-section" class="border-accent gap-y-m flex flex-col border-t-4">
  <h2 class="pt-1 font-serif font-bold">回应</h2>
  {#if user}
    {#if canReply}
      <div class="bg-overlay p-m flex flex-row items-center justify-between">
        <p>撰文回应此文章</p>
        <Action element="a" href={replyUrl}><MdiReplyOutline />回应</Action>
      </div>
    {:else}
      <div class="bg-overlay p-m flex flex-row items-center justify-between">
        <p>成为作者后，可撰写文章回应</p>
        <Action element="a" href={consoleRoutes.beWriter.route}>成为作者</Action>
      </div>
    {/if}
  {:else}
    <div class="bg-overlay p-m flex flex-row items-center justify-between">
      <p>登录并成为作者后，可撰写文章回应</p>
      <Action element="a" href={`/auth?next=${authNext}`}>登录/注册</Action>
    </div>
  {/if}
  {#if replies.length > 0}
    <h6 class="pt-1 font-bold">
      回应文章 {replies.length}
    </h6>
  {/if}
  <div class="gap-y-m flex flex-col">
    {#each replies as reply (reply.id)}
      <p class="bg-overlay py-xs px-s">
        <a class="hover:text-primary mr-2 font-serif text-2xl font-bold" href={`/a/${article.id}`}>
          {reply.title}
        </a>
        <a class="text-accent hover:text-accent-alt font-semibold" href={`/u/${article.authorUsername}`}>
          {reply.authorName}
        </a>
      </p>
    {/each}
  </div>
</div>
