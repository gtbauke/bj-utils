/**
 * Utility functions for API interactions
 */

/**
 * Fetch paginated data from Brasil Júnior API
 * @param {string} url - The base url without query parameters
 * @param {URLSearchParams|object} queryParams - Search parameters, excluding page/per_page
 * @param {string} token - Bearer token
 * @param {AbortSignal} signal - Abort signal for cancelling
 * @returns {Promise<Array>} - Array of fetched records
 */
async function fetchAllPaginated(url, queryParams, token, signal) {
    let currentPage = 1;
    let hasNextPage = true;
    const allRecords = [];

    while (hasNextPage) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const params = new URLSearchParams(queryParams);
        params.append("page", currentPage);
        // Using 100 as per_page based on existing code
        if (!params.has("per_page")) {
            params.append("per_page", 100);
        }

        try {
            const fetchOptions = { 
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "x-app-version": "37f9f29-2026-03-03",
                    "x-client": "web"
                } 
            };
            if (signal) fetchOptions.signal = signal;

            const response = await fetch(`${url}?${params.toString()}`, fetchOptions);

            if (!response.ok) break;

            const data = await response.json();
            const records = data.records || [];
            allRecords.push(...records);

            if (data.pagination && !data.pagination.last_page && data.pagination.next_page) {
                currentPage++;
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(resolve, 150);
                    if (signal) {
                        signal.addEventListener("abort", () => {
                            clearTimeout(timeout);
                            reject(new DOMException("Aborted", "AbortError"));
                        });
                    }
                });
            } else {
                hasNextPage = false;
            }
        } catch (err) {
            if (err.name === "AbortError") throw err;
            break;
        }
    }

    return allRecords;
}

/**
 * Sync federated EJs from all provided Admin Roles (Cores)
 * @param {string} token 
 * @param {Array} adminRoles - Array of roles stored by InfoInterceptor
 * @param {AbortSignal} signal 
 */
async function syncFederatedEJs(token, adminRoles, signal) {
    if (!adminRoles || adminRoles.length === 0) {
        throw new Error("No Admin Cores found to sync.");
    }

    const allRecordsMap = new Map();
    const params = new URLSearchParams();
    params.append("q[s]", "created_at desc");

    for (const role of adminRoles) {
        if (role.resource_type === "Core") {
            const url = `https://api.brasiljunior.org.br/v1/portal/cores/${role.resource_id}/ejs`;
            try {
                const records = await fetchAllPaginated(url, params, token, signal);
                
                records.forEach(record => {
                    // Only keep federated EJs and deduplicate by EJ ID
                    if (record.status?.toLowerCase() === "federated") {
                        // EXPLICITLY TAG the corresponding Core ID so the UI can filter later
                        record.fetched_core_id = role.resource_id;
                        allRecordsMap.set(record.id, record);
                    }
                });
            } catch (err) {
                console.error(`Error syncing EJs for Core ${role.resource_id}:`, err);
                if (err.name === "AbortError") throw err;
            }
        }
    }
    
    // Return flat array of unique EJs
    return Array.from(allRecordsMap.values());
}
