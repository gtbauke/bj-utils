# EJ Core and Federation Properties Design

## Purpose
Currently, Google Sheets reports (Members and Role Histories) are returning "N/A" for the `Núcleo` and `Federação` columns. The API's EJ endpoint does not explicitly provide these strings in the top-level EJ response.

The goal is to accurately populate these properties by leaning on the local application state (`CORES_CONTEXT_KEY`), which already tracks the user's admin spheres (Cores and Federations) at login time. 

## Proposed Changes

### 1. Enrich Application State at Login (`src/actions/login.action.ts`)
During authentication, the user's role contexts are captured and assembled into an array of Core objects representing their scope of access. We will normalize the objects stored in `CORES_CONTEXT_KEY` to an exact interface:

```typescript
export interface EnrichedCoreContext {
	resource_id: number;
	resource_type: "Core";
	core_name: string;
	federation_name: string;
}
```

**Implementation Details:**
- `federationRoles`: When querying child cores for a given federation (`fetchFederationCores`), the result will map elements with `core_name` set to the child core’s name, and `federation_name` set to the parent `fedRole.resource.name`.
- `coreRoles`: The elements pushed into the state array will explicitly pull `core_name` from `role.resource.name`. The `federation_name` will be retrieved via `role.resource.federation_name` (or a fallback like "Desconhecida" if omitted).

### 2. Connect Core Identity to EJs
The existing logic in `src/api/portal.api.ts` (`syncFederatedEJs`) successfully stamps `ej.fetched_core_id = role.resource_id`. This correctly retains the context relating an EJ to the Core from which it was fetched. No changes are required here.

### 3. Report Logic Update (`src/reports/members.report.ts` and `src/reports/roles.report.ts`)
We will read `CORES_CONTEXT_KEY` inside both report generator functions. 
A swift lookup will match the incoming `ej.fetched_core_id` against the array memory structure to define `Núcleo` and `Federação` exactly as they were captured during the login process logic.

```typescript
const allCores = context.get<EnrichedCoreContext[]>(CORES_CONTEXT_KEY) || [];
const matchingCore = allCores.find((c) => c.resource_id === ej.fetched_core_id);

const nucleo = matchingCore?.core_name || "N/A";
const federacao = matchingCore?.federation_name || "N/A";
// Then apply these to the returned records
```

## Potential Trade-offs
- Modifying the shape of the login states could marginally break existing code if anything else was implicitly relying on `.name` instead of `.core_name`. The surface area of the app has been verified, and fixing this locally at login provides the maximum cleanup for any later integrations.
