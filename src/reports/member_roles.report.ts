import { fetchAllPaginated } from "../api/portal.api.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

/**
 * Fetches all roles histories for a member in a given EJ.
 * This report includes historical roles and is sorted by name and start date.
 */
export async function fetchMemberRolesForEJ(
	ej: any,
	context: RequestContext,
): Promise<Record<string, string | number>[]> {
	if (!ej.slug) return [];

	const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/role_histories`;
	const params = new URLSearchParams();

	// Some APIs crash (500) with complex nested sorts, fetching raw and sorting in-memory instead.
	const records = await fetchAllPaginated(baseUrl, params, context);

	// In-memory sorting: Name (A-Z), then Start Date (Newest first)
	records.sort((a: any, b: any) => {
		const nameA = a.user_profile?.name || "";
		const nameB = b.user_profile?.name || "";
		if (nameA !== nameB) return nameA.localeCompare(nameB);

		const dateA = new Date(a.start_at || 0).getTime();
		const dateB = new Date(b.start_at || 0).getTime();
		return dateB - dateA;
	});

	const snapshotDate = new Date().toISOString().split("T")[0] as string; // YYYY-MM-DD

	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find(
		(c) => c.resource_id === ej.fetched_core_id,
	);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";

	return records.map((role: any) => {
		const user = role.user_profile || {};

		return {
			"Nome do Membro": user.name || "N/A",
			Email: user.email || "N/A",
			EJ: ej.name,
			Núcleo: nucleo,
			Federação: federacao,
			Cargo: role.pretty_name || role.name || "N/A",
			Início: role.start_at || "N/A",
			Fim: role.end_at || "N/A",
			Atual: role.current ? "Sim" : "Não",
			"Data do Snapshot": snapshotDate,
		};
	});
}
