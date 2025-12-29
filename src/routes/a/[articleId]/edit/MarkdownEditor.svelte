<script lang="ts">
  import { articleIssueMessages, compileArticle } from '$lib/markdown';
  import { resource } from 'runed';
  import Markdown from '$lib/component/Markdown.svelte';

  interface Props {
    article?: ReturnType<typeof $bindable<string>>;
    onValidateChange?: (valid: boolean) => void;
    onTitleChange?: (title: string) => void;
  }

  let { article = $bindable(''), onValidateChange, onTitleChange }: Props = $props();
  let mode: 'editor' | 'previewer' = $state('editor');
  const compilation = resource(
    () => article,
    async (value) => {
      return await compileArticle(value);
    },
    { debounce: 500 },
  );
  const compiled = $derived(compilation.current ?? { title: '', value: '', issues: [] });
  const { title, value: compiledValue, issues } = $derived(compiled);
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
  <textarea class="editor border-border w-full resize-none overflow-y-scroll border p-1" bind:value={article}
  ></textarea>
{:else}
  <div class="editor border-border overflow-y-scroll border p-1">
    <Markdown content={compiledValue.toString()} />
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
