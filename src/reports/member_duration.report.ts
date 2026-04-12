import { fetchAllPaginated } from "../api/portal.api.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

/**
 * Fetches members of an EJ and calculates their total duration of stay.
 */
export async function fetchMemberDurationForEJ(
	ej: any,
	context: RequestContext,
): Promise<Record<string, string | number>[]> {
	if (!ej.slug) return [];

	const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/user_profiles`;
	const params = new URLSearchParams();
	// We want all-time history for each member assigned to this EJ
	params.append("q[s]", "created_at desc");

	["member", "admin", "trainee"].forEach((role) => {
		params.append("q[role_histories_name_in][]", role);
	});

	const records = await fetchAllPaginated(baseUrl, params, context);

	const snapshotDate = new Date().toISOString().split("T")[0] as string; // YYYY-MM-DD

	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find(
		(c) => c.resource_id === ej.fetched_core_id,
	);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";

	return records.map((member: any) => {
		const memberships = member.memberships || [];

		if (memberships.length === 0) {
			return {
				Nome: member.name || "N/A",
				Email: member.email || "N/A",
				CPF: member.cpf || "N/A",
				EJ: ej.name,
				Núcleo: nucleo,
				Federação: federacao,
				Status: "Sem Filiação",
				"Data de Entrada": "N/A",
				"Última Data de Saída": "N/A",
				"Total de Dias": 0,
				"Data do Snapshot": snapshotDate,
			};
		}

		// Filter memberships for this EJ specifically if memberships contain metadata about the resource
		// However, usually user_profiles endpoint already filters memberships to the context of the resource
		const validStartDates = memberships
			.map((m: any) => m.start_at)
			.filter(Boolean)
			.map((d: string) => new Date(d).getTime());

		if (validStartDates.length === 0) {
			return {
				Nome: member.name || "N/A",
				Email: member.email || "N/A",
				CPF: member.cpf || "N/A",
				EJ: ej.name,
				Núcleo: nucleo,
				Federação: federacao,
				Status: "Erro de Dados (Sem data)",
				"Data de Entrada": "N/A",
				"Última Data de Saída": "N/A",
				"Total de Dias": 0,
				"Data do Snapshot": snapshotDate,
			};
		}

		const endDates = memberships.map((m: any) =>
			m.end_at ? new Date(m.end_at).getTime() : new Date().getTime(),
		);

		const earliestStart = new Date(Math.min(...validStartDates));
		const latestEnd = new Date(Math.max(...endDates));

		const isActive = memberships.some((m: any) => m.end_at === null);
		const durationMs = latestEnd.getTime() - earliestStart.getTime();
		const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

		return {
			Nome: member.name || "N/A",
			Email: member.email || "N/A",
			CPF: member.cpf || "N/A",
			EJ: ej.name,
			Núcleo: nucleo,
			Federação: federacao,
			Status: isActive ? "Ativo" : "Desligado",
			"Data de Entrada": (earliestStart.toISOString().split("T")[0] as string) || "N/A",
			"Última Data de Saída": isActive
				? "Ativo"
				: (latestEnd.toISOString().split("T")[0] as string) || "N/A",
			"Total de Dias": durationDays,
			"Data do Snapshot": snapshotDate,
		};
	});
}
