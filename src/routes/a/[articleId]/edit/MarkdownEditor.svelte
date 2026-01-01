<script lang="ts">
  import { articleIssueMessages, compileArticle, type CompiledArticle } from '$lib/markdown';
  import { resource } from 'runed';
  import Markdown from '$lib/component/Markdown.svelte';

  interface Props {
    content?: ReturnType<typeof $bindable<string>>;
    onValidateChange?: (valid: boolean) => void;
    onTitleChange?: (title: string) => void;
  }

  let { content = $bindable(''), onValidateChange, onTitleChange }: Props = $props();
  let mode: 'editor' | 'previewer' = $state('editor');
  const compilation = resource(
    () => content,
    async (content) => {
      return await compileArticle(content);
    },
    { debounce: 500 },
  );
  const compiled: CompiledArticle = $derived(compilation.current ?? { title: '', markup: '', issues: [] });
  const { title, markup, issues } = $derived(compiled);
  const issueMessages = $derived(issues.map((issue) => articleIssueMessages[issue]));

  $effect(() => {
    if (onValidateChange) {
      onValidateChange(issues.length === 0);
    }
    if (onTitleChange) {
      onTitleChange(title);
    }
  });

  const buttonClass = {
    activated: 'flex-1 p-0.5 text-text bg-surface',
    deactivated: 'flex-1 p-0.5 text-subtle bg-highlight-high/30 hover:text-text',
  };
</script>

<div class="switch border-border flex border">
  <button
    class={mode === 'editor' ? buttonClass.activated : buttonClass.deactivated}
    onclick={() => {
      mode = 'editor';
    }}>编辑</button
  >
  <button
    class={mode === 'previewer' ? buttonClass.activated : buttonClass.deactivated}
    onclick={() => {
      mode = 'previewer';
    }}>预览</button
  >
</div>

{#if mode === 'editor'}
  <textarea class="editor border-border w-full resize-none overflow-y-scroll border p-1" bind:value={content}
  ></textarea>
{:else}
  <div class="editor border-border overflow-y-scroll border p-1">
    <Markdown {markup} />
  </div>
{/if}

{#each issueMessages as issue}
  <div class="bg-error/30 text-error p-2">
    <p class="font-bold">{issue.title}</p>
    <small>{issue.description}</small>
  </div>
{/each}

<style>
  .editor {
    flex: 1 1 0;
  }
</style>
