# Plan of TODO

## Migrate to remote functions

Target:

1. Move all loading data and form actions to remote functions, except reading
   page parames and search params and something like these.
2. Don't use the code in `src/lib/server/services`, because after migrate, these
   services will be useless and will be removed.
3. Don't afraid refactor the data structure in components. Use the best data
   construction for components.

Routes:

- [x] /
- [x] /a/[articleId]
- [x] /a/[articleId]/edit
- [x] /auth
- [x] /console
- [x] /console/account
- [x] /console/be-writer
- [x] /console/bookmarks
- [x] /console/invites
- [x] /console/profile
- [x] /feeds
- [x] /u/[username]

After migrate

- [ ] Remove `src/lib/server/services`
- [ ] Extract common code for remote functions, like enhance

## Extend Auth Type

- [ ] Use single login/register page
- [ ] Google
- [ ] Mastodon
- [ ] Passkey
- [ ] Support bind multiple auth methods to one account
