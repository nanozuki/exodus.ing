<!--
  @component
  Import markdown.css and insert supplied markup as raw HTML inside .markdown. Sanitization belongs to the upstream
  compiler; this component does not sanitize or escape the markup.
-->
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
