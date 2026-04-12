import "dotenv/config";
import { select } from "@inquirer/prompts";
import { loginInContext } from "./actions/login.action.js";
import {
	runMemberRolesReportAction,
	runMembersReportAction,
	runRolesReportAction,
} from "./actions/reports.action.js";
import { RequestContext } from "./utils/requests/context.utils.js";

async function main() {
	console.log("=========================================");
	console.log("             BJ Utils CLI                ");
	console.log("=========================================\n");

	console.log("🔐 Authenticating...");
	const context = RequestContext.createEnvAuthContext();

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
