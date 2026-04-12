import { logError } from "../utils/logger.utils.js";
import {
	AUTH_CONTEXT_KEY,
	CORES_CONTEXT_KEY,
} from "../utils/requests/constants.utils.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

export async function fetchAllPaginated(
	url: string,
	queryParams: URLSearchParams,
	context: RequestContext,
) {
	const token = context.get<string>(AUTH_CONTEXT_KEY);
	let currentPage = 1;
	let hasNextPage = true;
	const allRecords: any[] = [];

	while (hasNextPage) {
		const params = new URLSearchParams(queryParams);
		params.append("page", currentPage.toString());
		if (!params.has("per_page")) {
			params.append("per_page", "100");
		}

		try {
			const response = await fetch(`${url}?${params.toString()}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"x-app-version": "37f9f29-2026-03-03",
					"x-client": "web",
				},
			});

			if (!response.ok) {
				const errorMsg = `Fetch failed with status: ${response.status} ${response.statusText}`;
				console.error(errorMsg);
				logError(errorMsg, `fetchAllPaginated: ${url}?${params.toString()}`);
				break;
			}

			const data = await response.json();
			const records = data.records || [];
			allRecords.push(...records);

			if (
				data.pagination &&
				!data.pagination.last_page &&
				data.pagination.next_page
			) {
				currentPage++;
				await new Promise((resolve) => setTimeout(resolve, 150));
			} else {
				hasNextPage = false;
			}
		} catch (err) {
			console.error("Error during paginated fetch:", err);
			logError(err, `fetchAllPaginated (exception): ${url}`);
			break;
		}
	}

	return allRecords;
}

export async function syncFederatedEJs(context: RequestContext) {
	const coreRoles = context.get<any[]>(CORES_CONTEXT_KEY);
	if (!coreRoles || coreRoles.length === 0) {
		throw new Error("No Admin Cores found to sync.");
	}

	const allRecordsMap = new Map();
	const params = new URLSearchParams();
	params.append("q[s]", "created_at desc");

	for (const role of coreRoles) {
		if (role.resource_type === "Core") {
			const url = `https://api.brasiljunior.org.br/v1/portal/cores/${role.resource_id}/ejs`;
			try {
				const records = await fetchAllPaginated(url, params, context);

				records.forEach((record: any) => {
					if (record.status?.toLowerCase() === "federated") {
						record.fetched_core_id = role.resource_id;
						allRecordsMap.set(record.id, record);
					}
				});
			} catch (err) {
				console.error(`Error syncing EJs for Core ${role.resource_id}:`, err);
				logError(err, `syncFederatedEJs: Core ${role.resource_id}`);
			}
		}
	}

	return Array.from(allRecordsMap.values());
}

export async function fetchFederationCores(
	federationId: number | string,
	context: RequestContext,
): Promise<any[]> {
	const token = context.get<string>(AUTH_CONTEXT_KEY);
	const url = `https://api.brasiljunior.org.br/v1/portal/federations/${federationId}/cores`;

	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
				"x-app-version": "37f9f29-2026-03-03",
				"x-client": "web",
			},
		});

		if (!response.ok) {
			const warnMsg = `Federation ${federationId} cores endpoint returned err: ${response.status}`;
			console.warn(warnMsg);
			logError(warnMsg, `fetchFederationCores: ${url}`);
			return [];
		}

		const data = await response.json();
		const coresList = data.records || data || [];
		return coresList;
	} catch (err) {
		console.error(`Failed to fetch cores for federation ${federationId}:`, err);
		logError(err, `fetchFederationCores (exception): ${url}`);
		return [];
	}
}
