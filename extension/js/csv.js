/**
 * Converts JSON to CSV and triggers download
 */
function downloadCSV(data, filenamePrefix = 'Report') {
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
		link.download = `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.csv`;

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
