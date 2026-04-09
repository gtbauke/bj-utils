import { login } from "../api/auth.api.js";
import {
	AUTH_CONTEXT_KEY,
	LOGIN_CONTEXT_KEY,
	PASSWORD_CONTEXT_KEY,
} from "../utils/requests/constants.utils.js";
import type { RequestContext } from "../utils/requests/context.utils.js";
import { LoginCredentialsNotDefinedError } from "./errors/login-credentials-not-defined.error.js";

export async function loginInContext(context: RequestContext) {
	const loginValue = context.get<string>(LOGIN_CONTEXT_KEY);
	const passwordValue = context.get<string>(PASSWORD_CONTEXT_KEY);

	if (!loginValue || !passwordValue) {
		throw new LoginCredentialsNotDefinedError();
	}

	const response = await login(loginValue, passwordValue);
	context.set(AUTH_CONTEXT_KEY, response.access_token);
}
