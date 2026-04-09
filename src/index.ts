import "dotenv/config.js";
import { login } from "./api/auth.api.js";

async function main() {
	console.log(await login("49834008856", "NSPHexaAI25@"));
}

main()
	.then(() => {
		console.log("Done!");
	})
	.catch((error) => {
		console.error(error);
	});
