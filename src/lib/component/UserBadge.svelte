<script lang="ts">
  interface UserBadgeProps {
    name: string;
    username: string;
  }
  const { name, username }: UserBadgeProps = $props();
</script>

<a data-sveltekit-reload class="text-accent hover:text-accent-alt" href={`/u/${username}`}>
  {name}
</a>
