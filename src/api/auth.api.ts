import { safeFetch } from "../utils/requests/fetch.utils.js";
import type { User } from "../utils/types.utils.js";

export interface LoginResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	created_at: number;
	status_code: number;
	message: string;
	user: User;
}

export async function login(
	login: string,
	password: string,
): Promise<LoginResponse> {
	const response = await safeFetch<LoginResponse>("AUTH", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ login, password, grant_type: "password" }),
	});

	return response;
}
