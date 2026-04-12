import { fetchAllPaginated } from "../api/portal.api.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

export async function fetchRoleHistoriesForEJ(
	ej: any,
	context: RequestContext,
): Promise<Record<string, string | number>[]> {
	if (!ej.slug) return [];

	const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/role_histories`;
	const params = new URLSearchParams();
	params.append("q[current_eq]", "true");
	params.append("q[name_not_eq]", "post_junior");
	params.append("q[start_at_lt]", "2026-01-01T00:00:00.000-03:00");
	params.append("q[s]", "name asc");

	const records = await fetchAllPaginated(baseUrl, params, context);

	const targetRecords = records.filter(
		(role: any) => role.membership && role.membership.closing_term_id === null,
	);

	const snapshotDate = new Date().toISOString().split("T")[0] as string; // YYYY-MM-DD

	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find((c) => c.resource_id === ej.fetched_core_id);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";

	return targetRecords.map((role: any) => {
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
