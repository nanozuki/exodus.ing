<script lang="ts">
  import './markdown.css';

  interface MarkdownProps {
    markup: string;
  }

  const { markup }: MarkdownProps = $props();
</script>

<div class="markdown">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html markup}
</div>
