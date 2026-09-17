import "dotenv/config";
import { select, input } from "@inquirer/prompts";
import { loginInContext } from "./actions/login.action.js";
import {
	runMemberRolesReportAction,
	runMembersReportAction,
	runRolesReportAction,
	runMemberDurationReportAction,
	runMemberParticipationReportAction,
} from "./actions/reports.action.js";
import { RequestContext } from "./utils/requests/context.utils.js";
import { OUTPUT_MODE_CONTEXT_KEY } from "./utils/requests/constants.utils.js";

async function main() {
	console.log("=========================================");
	console.log("             BJ Utils CLI                ");
	console.log("=========================================\n");

	console.log("🔐 Authenticating...");
	const context = RequestContext.createEnvAuthContext();

	const isLocal = process.argv.includes("--local") || process.argv.includes("-l");
	if (isLocal) {
		context.set(OUTPUT_MODE_CONTEXT_KEY, "local");
		console.log("📂 Local Mode Enabled: Output will be saved to CSV files.\n");
	}

	try {
		await context.runWithContext([loginInContext]);
		console.log("✅ Authenticated successfully.\n");
	} catch (e: any) {
		console.error("❌ Authentication failed. Check your .env LOGIN/PASSWORD.");
		throw e;
	}

	let exit = false;

	while (!exit) {
		const answer = await select({
			message: "Select an action to perform:",
			choices: [
				{
					name: "Membros de EJs (Report)",
					value: "members",
					description:
						"Fetches members of all federated EJs and appends them to Google Sheets.",
				},
				{
					name: "Histórico de Cargos - Snapshot Atual (Report)",
					value: "roles",
					description:
						"Fetches role histories of all federated EJs (2026 snapshot) and appends them to Google Sheets.",
				},
				{
					name: "Histórico de Cargos - Completo (Report)",
					value: "member_roles",
					description:
						"Fetches FULL role histories (all time) of all federated EJs and appends them to Google Sheets.",
				},
				{
					name: "Duração de Membros na EJ (Report)",
					value: "member_duration",
					description:
						"Calculates total time each member stayed in the EJ based on membership history.",
				},
				{
					name: "Participação em Eventos (Report)",
					value: "member_participation",
					description:
						"Returns all events that a member participated in for a specific year.",
				},
				{
					name: "Sair / Exit",
					value: "exit",
				},
			],
		});

		switch (answer) {
			case "members":
				await context.runWithContext([runMembersReportAction]);
				break;
			case "roles":
				await context.runWithContext([runRolesReportAction]);
				break;
			case "member_roles":
				await context.runWithContext([runMemberRolesReportAction]);
				break;
			case "member_duration":
				await context.runWithContext([runMemberDurationReportAction]);
				break;
			case "member_participation": {
				const currentYear = new Date().getFullYear().toString();
				const yearInput = await input({
					message: "Qual o ano do relatório?",
					default: currentYear,
					validate: (val) =>
						!Number.isNaN(Number(val)) || "Por favor, insira um ano válido.",
				});
				await context.runWithContext([
					(ctx) => runMemberParticipationReportAction(ctx, Number(yearInput)),
				]);
				break;
			}
			case "exit":
				exit = true;
				console.log("Goodbye!");
				break;
		}
	}
}

main().catch((error) => {
	console.error("\n❌ A fatal error occurred:");
	console.error(error);
	process.exit(1);
});
