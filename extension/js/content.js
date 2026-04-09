/**
 * Entry point for the content script.
 * Relies on api.js, csv.js, reports.js, and ui.js being loaded previously via manifest.json.
 */

// Storage Listeners
chrome.storage.local.get(
	["api_data", "admin_roles"],
	(res) => renderMonitorPanel(res.api_data || [], res.admin_roles || []),
);

chrome.storage.onChanged.addListener((changes) => {
	if (changes.api_data || changes.admin_roles) {
        chrome.storage.local.get(
            ["api_data", "admin_roles"],
            (res) => renderMonitorPanel(res.api_data || [], res.admin_roles || []),
        );
    }
});
