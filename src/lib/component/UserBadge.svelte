<script lang="ts">
  interface UserBadgeProps {
    name: string;
    username: string;
  }
  const { name, username }: UserBadgeProps = $props();
</script>

<a class="font-medium text-accent hover:text-accent-alt" href={`/u/${username}`}>
  {name}
</a>
