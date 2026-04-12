import fs from "node:fs";
import path from "node:path";

const LOGS_DIR = path.resolve("logs");
const ERROR_LOG_FILE = path.join(LOGS_DIR, "api_errors.log");

/**
 * Logs an error to a local file.
 * Creates the logs directory if it doesn't exist.
 */
export function logError(error: any, context?: string) {
	if (!fs.existsSync(LOGS_DIR)) {
		fs.mkdirSync(LOGS_DIR, { recursive: true });
	}

	const timestamp = new Date().toISOString();
	const contextLine = context ? `Context: ${context}\n` : "";
	const errorMessage =
		error instanceof Error ? error.stack : JSON.stringify(error, null, 2);

	const logEntry = `[${timestamp}]\n${contextLine}${errorMessage}\n${"-".repeat(50)}\n`;

	try {
		fs.appendFileSync(ERROR_LOG_FILE, logEntry, "utf8");
	} catch (fsErr) {
		console.error("Critical: Failed to write to error log file:", fsErr);
	}
}
