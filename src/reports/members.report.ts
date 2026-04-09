import { loginInContext } from "../pipelines/login.pipeline.js";
import { RequestContext } from "../utils/requests/context.utils.js";

async function generateMembersReport() {
	const context = RequestContext.createEnvAuthContext();

	loginInContext(context);
}
