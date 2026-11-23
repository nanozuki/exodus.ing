<!--
  @component
  Render user.name linked to `/u/@<user.username>` without encoding or data lookup. Accept the shared UserSummary
  projection from article authors, invitation relations, or a fuller User/LoggedInUser value; display requires no
  additional user lookup.
-->
<script lang="ts">
  import type { UserSummary } from '#lib/models/user.js';

  interface UserBadgeProps {
    user: UserSummary;
  }

  const { user }: UserBadgeProps = $props();
</script>

<a class="text-accent hover:text-accent-alt font-medium" href={`/u/@${user.username}`}>{user.name}</a>
