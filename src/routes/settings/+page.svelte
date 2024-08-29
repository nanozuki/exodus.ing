<svelte:head>
  <title>Settings</title>
  <meta property="og:title" content="Settings" />
</svelte:head>

<h3>Settings</h3>

<h4>Profile</h4>
<form action="?profile/username" method="post">
  <label>
    Name:
    <input type="text" name="name" value="" />
  </label>
  <button type="submit">Update</button>
</form>
<form action="?profile/description" method="post">
  <label>
    Description:
    <textarea name="description"></textarea>
  </label>
  <button type="submit">Update</button>
</form>

<h4>Account</h4>
<form action="?account/username" method="post">
  <label>
    Username:
    <input type="text" name="username" value="" />
  </label>
</form>
<form action="?account/githubId" method="post">
  <label>
    GitHubId:
    <input type="text" name="githubId" value="" />
  </label>
</form>
