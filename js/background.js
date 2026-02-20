let capturedToken = null;

chrome.webRequest.onBeforeSendHeaders.addListener(
	(details) => {
		if (details.initiator?.startsWith("chrome-extension://")) return;

		const authHeader = details.requestHeaders?.find(
			(h) => h.name.toLowerCase() === "authorization",
		);

		if (authHeader?.value.startsWith("Bearer ")) {
			const newToken = authHeader.value.split(" ")[1];

			// Only proceed if it's a new token or first time capturing
			if (capturedToken === newToken) return;

			capturedToken = newToken;
			console.log("Token captured and syncing to storage...");

			// 1. Fetch EJ data
			fetch(
				"https://api.brasiljunior.org.br/v1/portal/cores/25/ejs?page=1&per_page=100&q%5Bs%5D=created_at%20desc",
				{
					headers: { Authorization: `Bearer ${capturedToken}` },
				},
			)
				.then((response) => response.json())
				.then((data) => {
					const allRecords = data.records || [];
					const federatedEJs = allRecords.filter(
						(record) => record.status?.toLowerCase() === "federated",
					);

					// 2. SAVE BOTH: The filtered EJs AND the Token
					chrome.storage.local.set(
						{
							api_data: federatedEJs,
							session_token: capturedToken, // <--- SAVING TOKEN HERE
							last_updated: new Date().toISOString(),
						},
						() => {
							console.log("Data and Token successfully synchronized.");
						},
					);
				})
				.catch((err) => {
					console.error("Fetch Error:", err);
					capturedToken = null;
				});
		}
	},
	{
		urls: ["https://api.brasiljunior.org.br/*"],
		types: ["xmlhttprequest"],
	},
	["requestHeaders"],
);
