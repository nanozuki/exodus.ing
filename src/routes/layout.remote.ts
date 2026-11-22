import { getRequestEvent, query } from '$app/server';

/**
 * Returns the viewer from request locals, or null for anonymous requests. The server hook has already validated the
 * session and renewed its cookie; this query writes no cookies. The root layout and any descendant may call it and
 * share the framework's query cache. The result is presentation state, not proof of permission: protected remotes
 * and use cases authorize on their own.
 *
 * Locals are fixed for the request, so a mutation that changes the session, profile, username, or roles must not
 * refresh this query in the same request. Such mutations redirect, and the default remote-form invalidation reloads
 * it; custom form enhancement that replaces that behavior must refresh active queries from the client.
 */
export const loadLayoutData = query(async () => ({ user: getRequestEvent().locals.loggedInUser }));
