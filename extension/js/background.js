chrome.webRequest.onBeforeSendHeaders.addListener(
	(details) => {
		// Ignore requests made by our own extension UI/buttons
		if (details.initiator?.startsWith("chrome-extension://")) return;

		try {
            const authHeader = details.requestHeaders?.find(
                (h) => h.name.toLowerCase() === "authorization",
            );

            if (authHeader?.value.startsWith("Bearer ")) {
                const newToken = authHeader.value.split(" ")[1];
                
                if (!newToken) {
                    console.warn("[TokenInterceptor] Authorization header found, but token extraction failed.");
                    return;
                }

                chrome.storage.local.get(["session_token"], (res) => {
                    if (res.session_token !== newToken) {
                        chrome.storage.local.set({
                            session_token: newToken,
                            last_token_update: new Date().toISOString(),
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("[TokenInterceptor] Error saving token to storage:", chrome.runtime.lastError);
                            } else {
                                console.log("[TokenInterceptor] SUCCESS: New token captured and saved to storage.");
                            }
                        });
                    }
                });

                // Check if this is the info endpoint
                if (details.url.startsWith("https://api.brasiljunior.org.br/oauth/token/info")) {
                    console.log(`[InfoInterceptor] Captured authorization header. Starting info fetch...`);
                    fetchAndProcessInfo(details.url, newToken);
                }
            }
        } catch (error) {
            console.error("[TokenInterceptor] UNEXPECTED ERROR during token extraction:", error);
        }
	},
	{
		urls: ["https://api.brasiljunior.org.br/*"],
		types: ["xmlhttprequest"],
	},
	["requestHeaders"],
);

/**
 * Re-fetch the endpoint manually using the Authorization token
 * to extract User Admin Roles.
 */
async function fetchAndProcessInfo(url, token) {
    try {
        const res = await fetch(url, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "x-app-version": "37f9f29-2026-03-03",
                "x-client": "web"
            }
        });

        if (!res.ok) {
            console.error(`[InfoInterceptor] Fetch failed with status ${res.status}: ${res.statusText}`);
            return;
        }
        
        const data = await res.json();
        const roles = data.user?.roles || [];
        let adminRoles = [];
        
        for (const role of roles) {
            if (role.current && role.name === "admin") {
                if (role.resource_type === "Core") {
                    adminRoles.push({
                        resource_id: role.resource_id,
                        resource_type: role.resource_type,
                        resource_name: role.resource?.name || `Núcleo #${role.resource_id}`
                    });
                    console.log(`User is an admin for Core ID: ${role.resource_id}`);
                } 
                else if (role.resource_type === "Federation") {
                    // First add the Federation itself
                    adminRoles.push({
                        resource_id: role.resource_id,
                        resource_type: role.resource_type,
                        resource_name: role.resource?.name || `Federação #${role.resource_id}`
                    });
                    console.log(`User is an admin for Federation ID: ${role.resource_id}. Fetching related Cores...`);
                    
                    // Fetch the associated Cores
                    const federationCoresUrl = `https://api.brasiljunior.org.br/v1/portal/federations/${role.resource_id}/cores`;
                    
                    try {
                        const coresRes = await fetch(federationCoresUrl, {
                            headers: { 
                                "Authorization": `Bearer ${token}`,
                                "Accept": "application/json",
                                "x-app-version": "37f9f29-2026-03-03",
                                "x-client": "web"
                            }
                        });
                        
                        if (coresRes.ok) {
                            const coresData = await coresRes.json();
                            const coresList = coresData.records || coresData || [];
                            
                            coresList.forEach(core => {
                                // Prevent duplicates if the user is both an Admin of the Core directly AND its Federation
                                if (!adminRoles.find(r => r.resource_id === core.id && r.resource_type === "Core")) {
                                    adminRoles.push({
                                        resource_id: core.id,
                                        resource_type: "Core",
                                        resource_name: core.name || `Núcleo #${core.id}`
                                    });
                                    console.log(`Added Federation Core ID: ${core.id}`);
                                }
                            });
                        } else {
                            console.warn(`Federation ${role.resource_id} /cores endpoint returned error status: ${coresRes.status}`);
                        }
                    } catch (err) {
                        console.error(`Failed to fetch cores for federation ${role.resource_id}:`, err);
                    }
                }
            }
        }
        
        // If they have admin privileges, save the resource types and IDs to chrome.storage
        if (adminRoles.length > 0) {
            chrome.storage.local.set({ 
                admin_roles: adminRoles,
                last_info_sync: new Date().toISOString()
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("[InfoInterceptor] Error saving admin roles to storage:", chrome.runtime.lastError);
                } else {
                    console.log(`[InfoInterceptor] SUCCESS: Saved ${adminRoles.length} admin role(s) to storage:`, adminRoles);
                }
            });
        } else {
            console.log("[InfoInterceptor] COMPLETE: No valid admin privileges found for Core or Federation rules.");
        }
        
    } catch (error) {
        console.error("[InfoInterceptor] UNEXPECTED ERROR during fetchAndProcessInfo:", error);
    }
}
