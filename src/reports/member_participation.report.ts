import type { RequestContext } from "../utils/requests/context.utils.js";
import { AUTH_CONTEXT_KEY } from "../utils/requests/constants.utils.js";

/**
 * Fetches members and their event participation for an EJ.
 */
export async function fetchMemberParticipationForEJ(
	ej: any,
	context: RequestContext,
	year: number,
): Promise<Record<string, string | number>[]> {
	if (!ej.slug) return [];

	const token = context.get<string>(AUTH_CONTEXT_KEY);
	const url = `https://api.brasiljunior.org.br/v1/portal/ejs/${ej.slug}/reports/collaborative_members?year=${year}`;

	let data: any;
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
			console.error(`Failed to fetch participation for ${ej.slug}: ${response.status} ${response.statusText}`);
			return [];
		}

		data = await response.json();
	} catch (error) {
		console.error(`Error fetching participation for ${ej.slug}:`, error);
		return [];
	}

	const membersThatParticipated = data?.record?.members_that_participated || {};
	const rows: Record<string, string | number>[] = [];
	const snapshotDate = new Date().toISOString().split("T")[0] as string;

	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find(
		(c) => c.resource_id === ej.fetched_core_id,
	);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";

	for (const memberId in membersThatParticipated) {
		const memberData = membersThatParticipated[memberId];
		const user = memberData.user || {};
		const events = memberData.events || [];

		const baseRow = {
			Nome: user.name || "N/A",
			Email: user.email || "N/A",
			CPF: user.cpf || "N/A",
			EJ: ej.name,
			Núcleo: nucleo,
			Federação: federacao,
			"Data do Snapshot": snapshotDate,
		};

		if (events.length === 0) {
			rows.push({
				...baseRow,
				Evento: "Nenhum",
				"ID do Evento": "N/A",
			});
		} else {
			for (const event of events) {
				rows.push({
					...baseRow,
					Evento: event.name || "N/A",
					"ID do Evento": event.id || "N/A",
				});
			}
		}
	}

	return rows;
}
