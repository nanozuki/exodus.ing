import { getRequestEvent, query } from '$app/server';

export const loadLayoutData = query(async () => ({ user: getRequestEvent().locals.loggedInUser }));
