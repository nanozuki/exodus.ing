# src/routes/auth/sign-up

The sign-up page for a verified identity that belongs to no account yet. The
OAuth callback starts it by setting the `sign_up_session` cookie; the visitor
picks a username and display name to create the account, or cancels. Both end
the pending sign-up.
