# Member Roles History Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new report type that fetches and displays the full role history for all members of an EJ.

**Architecture:** Create a new report module `member_roles.report.ts` that fetches unfiltered `role_histories` from the Portal API.

**Tech Stack:** TypeScript, Brasil Júnior Portal API.

---

### Task 1: Create Member Roles Report Module

**Files:**
*   Create: `src/reports/member_roles.report.ts`

- [ ] **Step 1: Write the implementation**
Adapt the logic from `roles.report.ts` but remove filters for current roles and date limiters.

```typescript
import { fetchAllPaginated } from "../api/portal.api.js";
import type { RequestContext } from "../utils/requests/context.utils.js";

export async function fetchMemberRolesForEJ(
	ej: any,
	context: RequestContext,
): Promise<Record<string, string | number>[]> {
	if (!ej.slug) return [];

	const baseUrl = `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/role_histories`;
	const params = new URLSearchParams();
	// Sorting by user name and start date to group roles correctly
	params.append("q[s]", "user_profile_name asc, start_at desc");

	const records = await fetchAllPaginated(baseUrl, params, context);

	const snapshotDate = new Date().toISOString().split("T")[0] as string;

	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find((c) => c.resource_id === ej.fetched_core_id);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";

	return records.map((role: any) => {
		const user = role.user_profile || {};

		return {
			"Nome do Membro": user.name || "N/A",
			Email: user.email || "N/A",
			EJ: ej.name,
			Núcleo: nucleo,
			Federação: federacao,
			Cargo: role.pretty_name || role.name || "N/A",
			Início: role.start_at || "N/A",
			Fim: role.end_at || "N/A",
			Atual: role.current ? "Sim" : "Não",
			"Data do Snapshot": snapshotDate,
		};
	});
}
```

- [ ] **Step 2: Commit**
```bash
git add src/reports/member_roles.report.ts
git commit -m "feat: add member roles history report"
```
