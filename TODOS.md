# Plan of TODO

## Migrate to remote functions

Routes:

- [x] /
- [x] /a/[articleId]
- [x] /a/[articleId]/edit
- [ ] /auth
- [ ] /console
- [ ] /console/account
- [ ] /console/be-writer
- [ ] /console/bookmarks
- [ ] /console/invites
- [ ] /console/profile
- [ ] /feeds
- [ ] /u/[username]

## Support external-link article

- [x] Create/Edit page support external-link article type
  - [x] Extract MarkdownEditor component
  - [x] Get article content from query, check contentType
  - [x] Add dummy external article form
  - [x] Implemented external article form
  - [x] Add extrance for create two types of article, use query param enter type editor
- [x] Article page support external-link article type
- [x] ArticleList support external-link article type
- [ ] Feed support external-link article type
