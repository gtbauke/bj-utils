import fs from "node:fs";
import path from "node:path";

export async function saveReportToCsv(
	title: string,
	data: Record<string, string | number>[],
) {
	if (data.length === 0) {
		console.log("⚠️ No data to save.");
		return;
	}

	const outputsDir = path.join(process.cwd(), "outputs");
	if (!fs.existsSync(outputsDir)) {
		fs.mkdirSync(outputsDir, { recursive: true });
	}

	const timestamp = new Date()
		.toISOString()
		.replace(/[:.]/g, "-")
		.replace("T", "_")
		.slice(0, 19);
	const fileName = `${title.replaceAll(" ", "_")}_${timestamp}.csv`;
	const filePath = path.join(outputsDir, fileName);

	const headers = Object.keys(data[0]!);
	const csvRows = [];

	// Add header row
	csvRows.push(headers.join(","));

	// Add data rows
	for (const row of data) {
		const values = headers.map((header) => {
			const value = row[header] ?? "";
			const stringValue = String(value);
			// Wrap in quotes if it contains a comma, newline, or double quote
			if (
				stringValue.includes(",") ||
				stringValue.includes("\n") ||
				stringValue.includes('"')
			) {
				return `"${stringValue.replaceAll('"', '""')}"`;
			}
			return stringValue;
		});
		csvRows.push(values.join(","));
	}

	const csvContent = csvRows.join("\n");
	fs.writeFileSync(filePath, csvContent);

	console.log(`✅ Report saved locally to: ${filePath}`);
}
