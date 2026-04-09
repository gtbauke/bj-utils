/**
 * Renders the Floating Monitor Panel with Report Selection
 * @param {Array} federatedEJs - Array of Record objects
 * @param {Array} adminRoles - Array of roles parsed from info interception
 * @param {Array} availableReports - Array of report configuration objects
 */
function renderMonitorPanel(federatedEJs, adminRoles = [], availableReports = REPORTS) {
    let panel = document.getElementById("bj-monitor-ui");

    if (!panel) {
        panel = document.createElement("div");
        panel.id = "bj-monitor-ui";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "320px",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            padding: "16px",
            borderRadius: "12px",
            zIndex: "2147483647",
            border: "1px solid #3b82f6",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            fontFamily: "system-ui, sans-serif",
            fontSize: "13px",
        });
        document.body.appendChild(panel);
    }

    // Generate options dynamically
    const reportOptionsHtml = availableReports
        .map(report => `<option value="${report.id}">${report.name}</option>`)
        .join("");

    const dataSyncHtml = `
    <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #334155;">
        <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:5px; font-weight:600; text-transform:uppercase;">Data Source</label>
        <button id="sync-ejs-btn" style="width:100%; background:#10b981; color:white; border:none; border-radius:4px; padding:6px; cursor:pointer; font-weight:600; font-size:11px; transition: background 0.2s;">
            ↓ Sync EJs (${federatedEJs.length} synchronized)
        </button>
    </div>
    `;

    // const adminRolesHtml = adminRoles.length > 0 ? `
    // <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #334155;">
    //     <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:5px; font-weight:600; text-transform:uppercase;">Admin Roles</label>
    //     ${adminRoles.map(role => `
    //         <div style="background:#1e293b; color:#fbbf24; border-radius:4px; padding:6px; font-size:11px; font-weight:bold; margin-bottom:4px; border:1px solid #475569;">
    //              👑 ${role.resource_type}: ${role.resource_name} (ID: ${role.resource_id})
    //         </div>
    //     `).join("")}
    // </div>
    // ` : ``;

    // Core Filter Dropdown
    const coreOptionsHtml = adminRoles
        .filter(role => role.resource_type === "Core")
        .map(role => `<option value="${role.resource_id}">${role.resource_name}</option>`)
        .join("");

    const reportSectionHtml = `
    <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #334155;">
        <label style="display:block; font-size:11px; color:#94a3b8; margin-bottom:5px; font-weight:600; text-transform:uppercase;">Generate Report</label>
        
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">
            <select id="report-type-select" style="width:100%; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; padding:4px; font-size:12px;">
                ${reportOptionsHtml}
            </select>
            
            <div style="display:flex; gap:8px;">
                <!-- NEW: Core Selector -->
                <select id="core-filter-select" style="flex:1; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; padding:4px; font-size:12px;">
                    <option value="all">Todas as EJs (Todos os Núcleos)</option>
                    ${coreOptionsHtml}
                </select>
                
                <button id="generate-report-btn" ${federatedEJs.length === 0 ? 'disabled' : ''} style="background:${federatedEJs.length === 0 ? '#64748b' : '#3b82f6'}; color:white; border:none; border-radius:4px; padding:4px 10px; cursor:${federatedEJs.length === 0 ? 'not-allowed' : 'pointer'}; font-weight:600; font-size:11px;">
                    Run
                </button>
            </div>
        </div>

        <div id="progress-area" style="display:none;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <div id="progress-container" style="flex:1; background:#1e293b; border-radius:10px; height:8px; overflow:hidden;">
                    <div id="progress-bar" style="width:0%; height:100%; background:#3b82f6; transition: width 0.3s ease;"></div>
                </div>
                <button id="cancel-report-btn" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:9px; font-weight:bold;">CANCEL</button>
            </div>
            <div id="progress-text" style="font-size:10px; color:#94a3b8; text-align:center;"></div>

            <div id="summary-stats" style="margin-top:8px; padding:6px; background:#1e293b; border-radius:6px; display:flex; justify-content:space-around; align-items:center;">
                <div style="text-align:center;">
                    <div style="font-size:9px; color:#64748b; text-transform:uppercase;">Items Found</div>
                    <div id="stat-item-count" style="font-size:14px; font-weight:bold; color:#3b82f6;">0</div>
                </div>
            </div>
        </div>
    </div>
    `;

    const listHtml = federatedEJs.length > 0 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-weight:700; color:#3b82f6; text-transform:uppercase;">Federated EJs</span>
        </div>
        <div style="max-height:180px; overflow-y:auto; scrollbar-width:thin;">
            ${federatedEJs.map(ej => `
                <div style="padding:8px; margin-bottom:4px; background:#1e293b; border-radius:4px; font-size:11px;">
                    <strong>${ej.name}</strong> <span style="color:#64748b; float:right;">${ej.state}</span>
                </div>
            `).join("")}
        </div>
    ` : ``;

    panel.innerHTML = dataSyncHtml + reportSectionHtml + listHtml;

    // --- Event Listeners ---
    document.getElementById("sync-ejs-btn").onclick = async () => {
        const btn = document.getElementById("sync-ejs-btn");
        btn.disabled = true;
        btn.innerText = "Syncing EJs...";
        btn.style.background = "#fbbf24";
        
        try {
            const storage = await chrome.storage.local.get(["session_token", "admin_roles"]);
            if (!storage.session_token) {
                alert("No token found. Please browse the portal first.");
                return;
            }
            if (!storage.admin_roles || storage.admin_roles.length === 0) {
                alert("No Admin Cores found. Please navigate to the portal dashboard to sync your privileges first.");
                return;
            }
            
            // Calls the new logic in api.js
            const syncedEJs = await syncFederatedEJs(storage.session_token, storage.admin_roles);
            await chrome.storage.local.set({ 
                api_data: syncedEJs, 
                last_updated: new Date().toISOString() 
            });
            btn.innerText = `Sync Complete! (${syncedEJs.length})`;
            btn.style.background = "#10b981";
        } catch (error) {
            console.error("Sync Error:", error);
            btn.innerText = "Sync Failed!";
            btn.style.background = "#ef4444";
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                // Render will trigger automatically due to storage listener
            }, 2000);
        }
    };

    document.getElementById("generate-report-btn").onclick = () => {
        if (federatedEJs.length === 0) return;
        const selectedType = document.getElementById("report-type-select").value;
        const selectedCoreFilter = document.getElementById("core-filter-select").value;
        const selectedReport = availableReports.find(r => r.id === selectedType);
        
        if (selectedReport) {
            // Apply Core filtering logic right before execution
            let targetEJs = federatedEJs;
            if (selectedCoreFilter !== "all") {
                const targetCoreId = parseInt(selectedCoreFilter, 10);
                // Filter down using the tag we mapped in api.js
                targetEJs = federatedEJs.filter(ej => ej.fetched_core_id === targetCoreId);
            }
            
            // Re-validate against empty subset
            if (targetEJs.length === 0) {
                alert("No EJs found actively corresponding to the selected Core.");
                return;
            }

            handleReportGeneration(selectedReport, targetEJs);
        }
    };
}

let reportAbortController = null;

async function handleReportGeneration(reportConfig, federatedEJs) {
    const storage = await chrome.storage.local.get(["session_token", "api_data"]);
    const token = storage.session_token;
    
    // Fallback to use provided parameter or stored data
    const ejs = federatedEJs || storage.api_data || [];

    if (!token || ejs.length === 0) {
        alert("No data or token found.");
        return;
    }

    reportAbortController = new AbortController();
    const { signal } = reportAbortController;

    const btn = document.getElementById("generate-report-btn");
    const cancelBtn = document.getElementById("cancel-report-btn");
    const progressArea = document.getElementById("progress-area");
    const progBar = document.getElementById("progress-bar");
    const progText = document.getElementById("progress-text");
    const itemStat = document.getElementById("stat-item-count");

    btn.disabled = true;
    progressArea.style.display = "block";
    itemStat.innerText = "0";

    cancelBtn.onclick = () => {
        if (reportAbortController) {
            reportAbortController.abort();
            progText.innerText = "Cancelled.";
            btn.disabled = false;
        }
    };

    // Callback function to be used by the report to update UI progress
    const updateProgress = (percentage, text, count) => {
        if (percentage !== undefined) progBar.style.width = `${percentage}%`;
        if (text !== undefined) progText.innerText = text;
        if (count !== undefined) itemStat.innerText = count.toLocaleString();
    };

    try {
        await reportConfig.run(ejs, token, signal, updateProgress);
    } catch (error) {
        if (error.name === "AbortError" || error.message === "AbortedByUser") {
            console.log("Report generation cancelled by user.");
            progText.innerText = "Cancelled.";
        } else {
            console.error("Report Error:", error);
            progText.innerText = "Error occurred.";
            alert("An error occurred during report generation. Check console for details.");
        }
    } finally {
        btn.disabled = false;
        cancelBtn.onclick = null;
        reportAbortController = null;
        setTimeout(() => {
            progressArea.style.display = "none";
            progBar.style.width = "0%";
        }, 5000); // Increased timeout so user can see final success/error msg
    }
}
