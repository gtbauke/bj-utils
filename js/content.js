/**
 * Renders the Floating Monitor Panel with Report Selection
 * @param {Array} federatedEJs - Array of Record objects
 */
function renderMonitorPanel(federatedEJs) {
	let panel = document.getElementById("bj-monitor-ui");

	if (!panel) {
		panel = document.createElement("div");
		panel.id = "bj-monitor-ui";
		Object.assign(panel.style, {
			position: "fixed",
			bottom: "20px",
			right: "20px",
			width: "320px",
			backgroundColor: "#0f172a",
			color: "#f8fafc",
			padding: "16px",
			borderRadius: "12px",
			zIndex: "2147483647",
			border: "1px solid #3b82f6",
			boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
			fontFamily: "system-ui, sans-serif",
			fontSize: "13px",
		});
		document.body.appendChild(panel);
	}

	// --- NEW: Report Selection Section ---
	const reportSectionHtml = `
    <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #334155;">
        <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:5px; font-weight:600; text-transform:uppercase;">Generate Report</label>
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <select id="report-type-select" style="flex:1; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; padding:4px; font-size:12px;">
                <option value="members">Membros de EJs</option>
            </select>
            <button id="generate-report-btn" style="background:#3b82f6; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:11px;">
                Run
            </button>
        </div>

        <div id="progress-area" style="display:none;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <div id="progress-container" style="flex:1; background:#1e293b; border-radius:10px; height:8px; overflow:hidden;">
                    <div id="progress-bar" style="width:0%; height:100%; background:#3b82f6; transition: width 0.3s ease;"></div>
                </div>
                <button id="cancel-report-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:9px; font-weight:bold;">CANCEL</button>
            </div>
            <div id="progress-text" style="font-size:10px; color:#94a3b8; text-align:center;"></div>

            <div id="summary-stats" style="margin-top:8px; padding:6px; background:#1e293b; border-radius:6px; display:flex; justify-content:space-around; align-items:center;">
                <div style="text-align:center;">
                    <div style="font-size:9px; color:#64748b; text-transform:uppercase;">Members Found</div>
                    <div id="stat-member-count" style="font-size:14px; font-weight:bold; color:#3b82f6;">0</div>
                </div>
            </div>
        </div>
    </div>
`;

	const headerHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-weight:700; color:#3b82f6; text-transform:uppercase;">Federated EJs</span>
            <span style="background:#1e3a8a; color:#bfdbfe; padding:2px 10px; border-radius:20px; font-size:11px;">${federatedEJs.length}</span>
        </div>
    `;

	const listHtml = `
        <div style="max-height:180px; overflow-y:auto; scrollbar-width:thin;">
            ${federatedEJs
							.map(
								(ej) => `
                <div style="padding:8px; margin-bottom:4px; background:#1e293b; border-radius:4px; font-size:11px;">
                    <strong>${ej.name}</strong> <span style="color:#64748b; float:right;">${ej.state}</span>
                </div>
            `,
							)
							.join("")}
        </div>
    `;

	panel.innerHTML = reportSectionHtml + headerHtml + listHtml;

	// --- Event Listeners ---
	document.getElementById("generate-report-btn").onclick = () => {
		const selectedType = document.getElementById("report-type-select").value;
		handleReportGeneration(selectedType, federatedEJs);
	};
}

/**
 * Main handler for report generation
 */
let reportAbortController = null;

async function handleReportGeneration(type) {
	if (type === "members") {
		const storage = await chrome.storage.local.get([
			"session_token",
			"api_data",
		]);
		const token = storage.session_token;
		const federatedEJs = storage.api_data || [];

		if (!token || federatedEJs.length === 0) {
			alert("No data or token found.");
			return;
		}

		reportAbortController = new AbortController();
		const { signal } = reportAbortController;

		const btn = document.getElementById("generate-report-btn");
		const progressArea = document.getElementById("progress-area");
		const progBar = document.getElementById("progress-bar");
		const progText = document.getElementById("progress-text");
		const memberStat = document.getElementById("stat-member-count");

		btn.disabled = true;
		progressArea.style.display = "block";
		memberStat.innerText = "0";

		try {
			const allMembers = [];
			const batchSize = 5;

			for (let i = 0; i < federatedEJs.length; i += batchSize) {
				if (signal.aborted) throw new Error("AbortedByUser");

				const batch = federatedEJs.slice(i, i + batchSize);
				const percentage = Math.round((i / federatedEJs.length) * 100);
				progBar.style.width = `${percentage}%`;
				progText.innerText = `Processing batch...`;

				const results = await Promise.all(
					batch.map((ej) => fetchMembersForEJ(ej, token, signal)),
				);

				results.forEach((members) => {
					allMembers.push(...members);
				});
				memberStat.innerText = allMembers.length.toLocaleString();
			}

			if (allMembers.length > 0) {
				progBar.style.width = "100%";
				progText.innerText = "Download ready!";
				downloadCSV(allMembers);
			} else {
				alert("No members found matching 'count_as_member' criteria.");
			}
		} catch (error) {
			console.error("Report Error:", error);
		} finally {
			btn.disabled = false;
			reportAbortController = null;
			setTimeout(() => {
				progressArea.style.display = "none";
			}, 3000);
		}
	}
}

/**
 * Fetches ALL members for a specific EJ slug using auto-pagination
 */
async function fetchMembersForEJ(ej, token, signal) {
	const allMembersForThisEJ = [];
	let currentPage = 1;
	let hasNextPage = true;

	if (!ej.slug) return [];

	while (hasNextPage) {
		if (signal.aborted) throw new DOMException("Aborted", "AbortError");

		const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/user_profiles`;
		const params = new URLSearchParams();
		params.append("page", currentPage);
		params.append("per_page", 100);
		params.append(
			"q[role_histories_start_at_gteq]",
			"2026-01-01T00:00:00.000-03:00",
		);
		params.append("q[s]", "created_at desc");

		["member", "admin", "trainee"].forEach((role) => {
			params.append("q[role_histories_name_in][]", role);
		});

		try {
			const response = await fetch(`${baseUrl}?${params.toString()}`, {
				headers: { Authorization: `Bearer ${token}` },
				signal: signal,
			});

			if (!response.ok) break;

			const data = await response.json();
			const records = data.records || [];

			// 1. FILTERING LOGIC:
			// Keep the member ONLY IF they have NO roles where resource_type is NOT "Ej"
			const filteredRecords = records.filter((member) => {
				const roles = member.current_role_histories || [];
				const hasNonEjRole = roles.some((role) => role.resource_type !== "Ej");
				return !hasNonEjRole;
			});

			const mapped = filteredRecords.map((member) => {
				// 1. Existing role logic
				const currentRoleName =
					member.current_role_histories?.[0]?.name || "N/A";

				// 2. Existing Pós-Júnior logic
				const hasEndedMembership = member.memberships?.some(
					(m) => m.end_at !== null,
				);
				const noCurrentRoles =
					!member.current_role_histories ||
					member.current_role_histories.length === 0;
				const isPosJunior = hasEndedMembership || noCurrentRoles ? "Yes" : "No";

				// 3. NEW: 2026 Metrics Column
				// Directly uses the count_as_member property from the Record interface
				const countsFor2026 = member.count_as_member ? "Yes" : "No";

				return {
					Nome: member.name || "N/A",
					CPF: member.cpf || "N/A",
					Email: member.email || "N/A",
					EJ: ej.name,
					"Cargo Atual": currentRoleName,
					"Pós-Júnior": isPosJunior,
					"Conta para as métricas de 2026?": countsFor2026, // Added Column
				};
			});

			allMembersForThisEJ.push(...mapped);

			if (
				data.pagination &&
				!data.pagination.last_page &&
				data.pagination.next_page
			) {
				currentPage++;
				await new Promise((resolve, reject) => {
					const timeout = setTimeout(resolve, 150);
					signal.addEventListener("abort", () => {
						clearTimeout(timeout);
						reject(new DOMException("Aborted", "AbortError"));
					});
				});
			} else {
				hasNextPage = false;
			}
		} catch (err) {
			if (err.name === "AbortError") throw err;
			break;
		}
	}
	return allMembersForThisEJ;
}

/**
 * Converts JSON to CSV and triggers download
 */
function downloadCSV(data) {
	if (!data || data.length === 0) {
		console.error("No data available to download.");
		return;
	}

	try {
		const headers = Object.keys(data[0]).join(",");
		const rows = data.map((row) =>
			Object.values(row)
				.map((val) => {
					// Escape quotes and handle commas in data
					const stringVal = String(val).replace(/"/g, '""');
					return `"${stringVal}"`;
				})
				.join(","),
		);

		// \uFEFF is the Byte Order Mark (BOM) for Excel UTF-8 compatibility
		const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.href = url;
		link.download = `BJ_Members_Report_${new Date().toISOString().split("T")[0]}.csv`;

		// Append to body (required for some browsers/sites)
		document.body.appendChild(link);
		link.click();

		// Cleanup
		setTimeout(() => {
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}, 100);

		console.log("Download triggered successfully.");
	} catch (err) {
		console.error("Error creating CSV file:", err);
	}
}

// Storage Listeners (Keep existing logic)
chrome.storage.local.get(
	["api_data"],
	(res) => res.api_data && renderMonitorPanel(res.api_data),
);

chrome.storage.onChanged.addListener((changes) => {
	if (changes.api_data?.newValue) renderMonitorPanel(changes.api_data.newValue);
});
