<script lang="ts">
  interface UserBadgeProps {
    name: string;
    username: string;
  }
  const { name, username }: UserBadgeProps = $props();
</script>

<a class="text-accent hover:text-accent-alt font-medium" href={`/u/@${username}`}>
  {name}
</a>
