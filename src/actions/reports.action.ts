import { appendRowsToSheet } from "../api/google-sheets.api.js";
import { syncFederatedEJs } from "../api/portal.api.js";
import { fetchMemberRolesForEJ } from "../reports/member_roles.report.js";
import { fetchMemberDurationForEJ } from "../reports/member_duration.report.js";
import { fetchMembersForEJ } from "../reports/members.report.js";
import { fetchRoleHistoriesForEJ } from "../reports/roles.report.js";
import { fetchMemberParticipationForEJ } from "../reports/member_participation.report.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

type ReportType =
	| "members"
	| "roles"
	| "member_roles"
	| "member_duration"
	| "member_participation";

async function executeReportInContext(
	context: RequestContext,
	reportType: ReportType,
	year?: number,
) {
	console.log("\n-----------------------------------------");
	let reportDisplayName = "";
	switch (reportType) {
		case "members":
			reportDisplayName = "Members";
			break;
		case "roles":
			reportDisplayName = "Role Histories (Snapshot)";
			break;
		case "member_roles":
			reportDisplayName = "Member Roles History (Full)";
			break;
		case "member_duration":
			reportDisplayName = "Member Duration/Stay";
			break;
		case "member_participation":
			reportDisplayName = `Member Participation (${year})`;
			break;
	}

	console.log(`🟢 Starting ${reportDisplayName} Report...`);
	console.log("-----------------------------------------");

	console.log("📡 Fetching federated EJs...");
	const federatedEJs = await syncFederatedEJs(context);
	console.log(`✅ Found ${federatedEJs.length} federated EJs.`);

	const allData: Record<string, string | number>[] = [];
	const batchSize = 5;

	for (let i = 0; i < federatedEJs.length; i += batchSize) {
		const batch = federatedEJs.slice(i, i + batchSize);
		const percentage = Math.round((i / federatedEJs.length) * 100);

		console.log(
			`⏳ Processing batch... ${percentage}% (${i}/${federatedEJs.length}) | Aggregated rows: ${allData.length}`,
		);

		let results: Record<string, string | number>[][] = [];
		if (reportType === "members") {
			results = await Promise.all(
				batch.map((ej) => fetchMembersForEJ(ej, context)),
			);
		} else if (reportType === "roles") {
			results = await Promise.all(
				batch.map((ej) => fetchRoleHistoriesForEJ(ej, context)),
			);
		} else if (reportType === "member_roles") {
			results = await Promise.all(
				batch.map((ej) => fetchMemberRolesForEJ(ej, context)),
			);
		} else if (reportType === "member_duration") {
			results = await Promise.all(
				batch.map((ej) => fetchMemberDurationForEJ(ej, context)),
			);
		} else if (reportType === "member_participation") {
			results = await Promise.all(
				batch.map((ej) =>
					fetchMemberParticipationForEJ(ej, context, year || 2026),
				),
			);
		}

		results.forEach((rows) => {
			allData.push(...rows);
		});
	}

	console.log(
		`\n🎉 Finished processing all EJs. Total rows collected: ${allData.length}`,
	);

	if (allData.length > 0) {
		console.log("☁️  Appending rows to Google Sheets...");
		let sheetTitle = "";
		switch (reportType) {
			case "members":
				sheetTitle = "Members";
				break;
			case "roles":
				sheetTitle = "Role Histories";
				break;
			case "member_roles":
				sheetTitle = "Member Roles History";
				break;
			case "member_duration":
				sheetTitle = "Member Duration";
				break;
			case "member_participation":
				sheetTitle = "Member Participation";
				break;
		}
		await appendRowsToSheet(context, sheetTitle, allData);
	} else {
		console.log("⚠️ No data found to append.");
	}
}

export const runMembersReportAction = async (context: RequestContext) =>
	executeReportInContext(context, "members");
export const runRolesReportAction = async (context: RequestContext) =>
	executeReportInContext(context, "roles");
export const runMemberRolesReportAction = async (context: RequestContext) =>
	executeReportInContext(context, "member_roles");
export const runMemberDurationReportAction = async (context: RequestContext) =>
	executeReportInContext(context, "member_duration");

export const runMemberParticipationReportAction = async (
	context: RequestContext,
	year: number,
) => executeReportInContext(context, "member_participation", year);
