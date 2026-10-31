<script lang="ts">
  import Dialog from './Dialog.svelte';
</script>

<Dialog labelledby="dialog-test-title">
  {#snippet trigger()}
    Edit username
  {/snippet}
  {#snippet content(close)}
    <h2 id="dialog-test-title">Change username</h2>
    <label>
      Username
      <input value="carol" />
    </label>
    <button type="button" onclick={close}>Cancel</button>
  {/snippet}
</Dialog>
