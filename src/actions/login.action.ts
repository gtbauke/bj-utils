import { login } from "../api/auth.api.js";
import {
	AUTH_CONTEXT_KEY,
	CORES_CONTEXT_KEY,
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

	const federationRoles = response.user.roles.filter((role) => {
		return (
			role.current &&
			role.name === "admin" &&
			role.resource_type === "Federation"
		);
	});

	const coreRoles = response.user.roles.filter((role) => {
		return (
			role.current && role.name === "admin" && role.resource_type === "Core"
		);
	});

	const allCores: any[] = coreRoles.map((role) => ({
		resource_id: role.resource_id,
		resource_type: "Core",
		core_name: role.resource.name,
		federation_name: role.resource.federation_name || "N/A",
	}));

	if (federationRoles.length > 0) {
		const { fetchFederationCores } = await import("../api/portal.api.js");
		for (const fedRole of federationRoles) {
			const fedCores = await fetchFederationCores(fedRole.resource_id, context);
			for (const fc of fedCores) {
				const alreadyExists = allCores.some(
					(c) => c.resource_id === fc.id && c.resource_type === "Core",
				);
				if (!alreadyExists) {
					allCores.push({
						resource_id: fc.id,
						resource_type: "Core",
						core_name: fc.name || `Núcleo #${fc.id}`,
						federation_name: fedRole.resource.name || "N/A",
					});
				}
			}
		}
	}

	context.set(CORES_CONTEXT_KEY, allCores);
}
