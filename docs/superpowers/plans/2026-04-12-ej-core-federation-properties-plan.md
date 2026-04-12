# EJ Core and Federation Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correctly inject `Núcleo` and `Federação` into the role and member reports based on the local cached Core context generated at login.

**Architecture:** We will normalize the items pushed to `CORES_CONTEXT_KEY` so they all contain `core_name` and `federation_name`. Then, in the two report iterators, we will look up the properties via the EJ's `fetched_core_id` against that key.

**Tech Stack:** TypeScript, Node.js

---

### Task 1: Normalize Core Context Object at Login

**Files:**
- Modify: `src/actions/login.action.ts`

- [ ] **Step 1: Write explicit mapping code**

In `src/actions/login.action.ts`, find where `allCores` elements are constructed and update them to accurately extract names.

Replace:
```typescript
	const allCores: any[] = [...coreRoles];
...
					allCores.push({
						resource_id: fc.id,
						resource_type: "Core",
						name: fc.name || `Núcleo #${fc.id}`,
					});
```

With:
```typescript
	const allCores: any[] = coreRoles.map((role) => ({
		resource_id: role.resource_id,
		resource_type: "Core",
		core_name: role.resource.name,
		federation_name: role.resource.federation_name || "N/A",
	}));
...
					allCores.push({
						resource_id: fc.id,
						resource_type: "Core",
						core_name: fc.name || `Núcleo #${fc.id}`,
						federation_name: fedRole.resource.name || "N/A",
					});
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/login.action.ts
git commit -m "feat: normalize core context stored during login"
```

### Task 2: Update Members Report Output

**Files:**
- Modify: `src/reports/members.report.ts`

- [ ] **Step 1: Write minimal implementation**

In `src/reports/members.report.ts`, directly access the `cores` from `context` and extract the mappings.

Add to `fetchMembersForEJ` (around the mapped row preparation):
```typescript
	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find((c) => c.resource_id === ej.fetched_core_id);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";
```

Update the returned object inside the map:
```typescript
			Núcleo: nucleo,
			Federação: federacao,
```

- [ ] **Step 2: Commit**

```bash
git add src/reports/members.report.ts
git commit -m "feat: inject nucleo and federacao properly to members report"
```

### Task 3: Update Roles Report Output

**Files:**
- Modify: `src/reports/roles.report.ts`

- [ ] **Step 1: Write minimal implementation**

In `src/reports/roles.report.ts`, replicate the matching logic.

Add to `fetchRoleHistoriesForEJ` (around the snapshot mapping):
```typescript
	const allCores = context.get<any[]>("cores") || [];
	const matchingCore = allCores.find((c) => c.resource_id === ej.fetched_core_id);
	const nucleo = matchingCore?.core_name || "N/A";
	const federacao = matchingCore?.federation_name || "N/A";
```

Update the returned object inside the map:
```typescript
			Núcleo: nucleo,
			Federação: federacao,
```

- [ ] **Step 2: Check project builds successfully**
```bash
npm run build
# OR use existing TS check commands if available. Since it runs via Node directly we can skip explicit compilation.
```

- [ ] **Step 3: Commit**

```bash
git add src/reports/roles.report.ts
git commit -m "feat: inject nucleo and federacao properly to roles report"
```
