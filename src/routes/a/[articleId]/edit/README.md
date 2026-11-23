# src/routes/a/[articleId]/edit

The article editor: guards article creation and editing, and renders the
Markdown or external-link editor while keeping the reply context. Remote forms
own publication writes and the final redirect, following the
[request-boundary conventions](../../../../../docs/architecture.md#request-boundaries-and-remote-functions).
