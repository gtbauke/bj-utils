import { fetchAllPaginated } from "../api/portal.api.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

export async function fetchMembersForEJ(
	ej: any,
	context: RequestContext,
): Promise<Record<string, string | number>[]> {
	if (!ej.slug) return [];

	const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/user_profiles`;
	const params = new URLSearchParams();
	params.append(
		"q[role_histories_start_at_gteq]",
		"2026-01-01T00:00:00.000-03:00",
	);
	params.append("q[s]", "created_at desc");

	["member", "admin", "trainee"].forEach((role) => {
		params.append("q[role_histories_name_in][]", role);
	});

	const records = await fetchAllPaginated(baseUrl, params, context);

	const filteredRecords = records.filter((member: any) => {
		const roles = member.current_role_histories || [];
		const hasNonEjRole = roles.some((role: any) => role.resource_type !== "Ej");
		return !hasNonEjRole;
	});

	const snapshotDate = new Date().toISOString().split("T")[0] as string; // YYYY-MM-DD

	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find(
		(c) => c.resource_id === ej.fetched_core_id,
	);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";

	return filteredRecords.map((member: any) => {
		const currentRoleName = member.current_role_histories?.[0]?.name || "N/A";

		const hasEndedMembership = member.memberships?.some(
			(m: any) => m.end_at !== null,
		);
		const noCurrentRoles =
			!member.current_role_histories ||
			member.current_role_histories.length === 0;
		const isPosJunior = hasEndedMembership || noCurrentRoles ? "Yes" : "No";

		const countsFor2026 = member.count_as_member ? "Yes" : "No";

		return {
			Nome: member.name || "N/A",
			CPF: member.cpf || "N/A",
			Email: member.email || "N/A",
			EJ: ej.name,
			Núcleo: nucleo,
			Federação: federacao,
			"Cargo Atual": currentRoleName,
			"Pós-Júnior": isPosJunior,
			"Conta para as métricas de 2026?": countsFor2026,
			"Data do Snapshot": snapshotDate,
		};
	});
}
