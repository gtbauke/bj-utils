/**
 * Defines available reports and their execution logic.
 */
const REPORTS = [
    {
        id: "members",
        name: "Membros de EJs",
        run: async (federatedEJs, token, signal, updateProgress) => {
            console.log("federatedEJs", federatedEJs);
            const allMembers = [];
            const batchSize = 5;

            for (let i = 0; i < federatedEJs.length; i += batchSize) {
                if (signal.aborted) throw new Error("AbortedByUser");

                const batch = federatedEJs.slice(i, i + batchSize);
                const percentage = Math.round((i / federatedEJs.length) * 100);
                
                // updateProgress is a callback provided by UI
                updateProgress(percentage, "Processing batch...", allMembers.length);

                const results = await Promise.all(
                    batch.map((ej) => fetchMembersForEJ(ej, token, signal))
                );

                results.forEach((members) => {
                    allMembers.push(...members);
                });
                
                updateProgress(percentage, "Processing batch...", allMembers.length);
            }

            if (allMembers.length > 0) {
                updateProgress(100, "Download ready!", allMembers.length);
                downloadCSV(allMembers, "BJ_Members_Report");
            } else {
                alert("No members found matching 'count_as_member' criteria.");
                updateProgress(100, "No data.", 0);
            }
        }
    },
    {
        id: "role_histories",
        name: "Histórico de Cargos",
        run: async (federatedEJs, token, signal, updateProgress) => {
            console.log("federatedEJs (Role Histories)", federatedEJs);
            const allRoles = [];
            const batchSize = 5;

            for (let i = 0; i < federatedEJs.length; i += batchSize) {
                if (signal.aborted) throw new Error("AbortedByUser");

                const batch = federatedEJs.slice(i, i + batchSize);
                const percentage = Math.round((i / federatedEJs.length) * 100);
                
                updateProgress(percentage, "Processing batch...", allRoles.length);

                const results = await Promise.all(
                    batch.map((ej) => fetchRoleHistoriesForEJ(ej, token, signal))
                );

                results.forEach((roles) => {
                    allRoles.push(...roles);
                });
                
                updateProgress(percentage, "Processing batch...", allRoles.length);
            }

            if (allRoles.length > 0) {
                updateProgress(100, "Download ready!", allRoles.length);
                downloadCSV(allRoles, "BJ_Role_Histories_Report");
            } else {
                alert("No role histories found matching criteria.");
                updateProgress(100, "No data.", 0);
            }
        }
    }
];

/**
 * Specific logic for fetching members of a single EJ.
 * Abstracted to use API utilities.
 */
async function fetchMembersForEJ(ej, token, signal) {
    if (!ej.slug) return [];

    const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/user_profiles`;
    const params = new URLSearchParams();
    params.append("q[role_histories_start_at_gteq]", "2026-01-01T00:00:00.000-03:00");
    params.append("q[s]", "created_at desc");

    ["member", "admin", "trainee"].forEach((role) => {
        params.append("q[role_histories_name_in][]", role);
    });

    const records = await fetchAllPaginated(baseUrl, params, token, signal);

    // Filter and map logic remains the same
    const filteredRecords = records.filter((member) => {
        const roles = member.current_role_histories || [];
        const hasNonEjRole = roles.some((role) => role.resource_type !== "Ej");
        return !hasNonEjRole;
    });

    return filteredRecords.map((member) => {
        const currentRoleName = member.current_role_histories?.[0]?.name || "N/A";
        
        const hasEndedMembership = member.memberships?.some((m) => m.end_at !== null);
        const noCurrentRoles = !member.current_role_histories || member.current_role_histories.length === 0;
        const isPosJunior = hasEndedMembership || noCurrentRoles ? "Yes" : "No";

        const countsFor2026 = member.count_as_member ? "Yes" : "No";

        return {
            Nome: member.name || "N/A",
            CPF: member.cpf || "N/A",
            Email: member.email || "N/A",
            EJ: ej.name,
            Núcleo: ej.core_names || "N/A",
            Federação: ej.federation_name || "N/A",
            "Cargo Atual": currentRoleName,
            "Pós-Júnior": isPosJunior,
            "Conta para as métricas de 2026?": countsFor2026,
        };
    });
}

/**
 * Specific logic for fetching role histories of a single EJ.
 * Uses the /role_histories endpoint and filters.
 */
async function fetchRoleHistoriesForEJ(ej, token, signal) {
    if (!ej.slug) return [];

    const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/role_histories`;
    const params = new URLSearchParams();
    params.append("q[current_eq]", "true");
    params.append("q[name_not_eq]", "post_junior");
    params.append("q[start_at_lt]", "2026-01-01T00:00:00.000-03:00");
    params.append("q[s]", "name asc");

    const records = await fetchAllPaginated(baseUrl, params, token, signal);

    // Filter only for roles where membership's closing_term_id is strictly null
    const targetRecords = records.filter(role => role.membership && role.membership.closing_term_id === null);

    return targetRecords.map((role) => {
        const user = role.user_profile || {};
        
        return {
            "Nome do Membro": user.name || "N/A",
            "Email": user.email || "N/A",
            "EJ": ej.name,
            "Núcleo": ej.core_names || "N/A",
            "Federação": ej.federation_name || "N/A",
            "Cargo": role.pretty_name || role.name || "N/A",
            "Início": role.start_at || "N/A",
            "Fim": role.end_at || "N/A",
            "Atual": role.current ? "Sim" : "Não"
        };
    });
}
