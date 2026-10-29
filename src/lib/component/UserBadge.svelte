<script lang="ts">
  import type { UserSummary } from '#lib/models/user.js';

  interface UserBadgeProps {
    user: UserSummary;
  }

  const { user }: UserBadgeProps = $props();
</script>

<a class="text-accent hover:text-accent-alt font-medium" href={`/u/@${user.username}`}>{user.name}</a>
