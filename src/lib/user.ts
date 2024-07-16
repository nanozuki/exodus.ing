export interface User {
	id: Buffer;
	username: string;
	email: string;
}

function NewUser(username: string, email: string): User {
	return {
		id: Buffer.alloc(16),
		username,
		email,
	};
}
