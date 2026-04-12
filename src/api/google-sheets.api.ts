import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
	GOOGLE_EMAIL_CONTEXT_KEY,
	GOOGLE_KEY_CONTEXT_KEY,
	GOOGLE_SHEET_ID_CONTEXT_KEY,
} from "../utils/requests/constants.utils.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

export async function appendRowsToSheet(
	context: RequestContext,
	sheetTitle: string,
	rows: Record<string, string | number>[],
) {
	const sheetId = context.get<string>(GOOGLE_SHEET_ID_CONTEXT_KEY);
	const email = context.get<string>(GOOGLE_EMAIL_CONTEXT_KEY);
	let key = context.get<string>(GOOGLE_KEY_CONTEXT_KEY);

	if (!sheetId || !email || !key) {
		throw new Error(
			"Google Sheets credentials are missing in the context (.env).",
		);
	}

	// Handle standard .env escaped newlines
	key = key.replace(/\\n/g, "\n");

	const serviceAccountAuth = new JWT({
		email,
		key,
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});

	const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
	await doc.loadInfo();

	const sheet = doc.sheetsByTitle[sheetTitle];
	if (!sheet) {
		throw new Error(`Sheet with title "${sheetTitle}" not found in document.`);
	}

	if (rows.length === 0) return;

	try {
		await sheet.loadHeaderRow();
	} catch {
		// loadHeaderRow throws an exception if the sheet is completely empty
	}

	if (!sheet.headerValues || sheet.headerValues.length === 0) {
		const expectedHeaders = Object.keys(rows[0]!);
		await sheet.setHeaderRow(expectedHeaders);
		console.log(`📝 Initialized headers for "${sheetTitle}".`);
	}

	await sheet.addRows(rows);
	console.log(`Successfully appended ${rows.length} rows to "${sheetTitle}".`);
}
