# BJ Utils CLI & Google Sheets Integration Design

## Goal
Convert the existing BJ Utils Chrome Extension reports functionality into a Node.js CLI tool. This application will run periodically (or on-demand) from a terminal, interact with the Brasil Junior API to fetch paginated data securely, and push a historical appended snapshot of that data to a master Google Spreadsheet.

## Architecture & Components

### 1. Interactive CLI Interface
- **Framework**: `@inquirer/prompts` to drive terminal interaction.
- **Flow**: User runs `npm start` -> CLI asks what action to perform (e.g. "Generate Members Report", "Generate Roles Report").
- **State**: The request logic is wrapped in the existing `RequestContext` environment.
- **Progress tracking**: Console out percentage and batches processed instead of browser DOM updates.

### 2. Google Sheets Integration
- **Framework**: `google-spreadsheet` npm package along with `google-auth-library`.
- **Auth**: Service Account credentials loaded from `.env` (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` or standard `GOOGLE_APPLICATION_CREDENTIALS` JSON path).
- **Master Sheet**: A central `GOOGLE_SPREADSHEET_ID` defined in `.env`.
- **Data Flow**: 
  - Instead of overwriting or creating new tabs per run, we hold static tabs named `Members` and `Role Histories`.
  - During the mapping process, a new column `"Data do Snapshot"` must be injected with the format `YYYY-MM-DD`.
  - We append rows to the bottom of the existing sheets ensuring historical continuity.

### 3. API & Fetch Modules (Brasil Junior)
- **Pagination Logic**: Port `fetchAllPaginated` from `api.js` into `src/api/portal.api.ts`, using Node `fetch` (with `safeFetch` logic) and keeping the loop that checks `pagination.next_page`.
- **EJs Fetch**: Port `syncFederatedEJs` to list all valid Federated EJs for data processing.
- **Reports**: Translate the `fetchMembersForEJ` and `fetchRoleHistoriesForEJ` to `src/reports/members.report.ts` and `src/reports/roles.report.ts`. 

## Data Flow Pipeline
1. `index.ts` is triggered -> CLI Prompt executed.
2. User selects "Roles History".
3. `auth.api.ts` performs login. `RequestContext` injects token.
4. `syncFederatedEJs` retrieves all active cores and their federated EJs.
5. `roles.report.ts` slices EJs into batches, utilizing `fetchAllPaginated`.
6. Results mapped to standard JSON array. `Data do Snapshot` is added to each object.
7. Data chunk passed to `google.api.ts`, which connects, grabs the specific Sheet Tab, and executes `sheet.addRows(mappedData)`.

## Error Handling & Reliability
- **Failed Batches**: Utilize try/catch across EJ batches. If one EJ fails, warn in the terminal but continue processing others.
- **Network Boundaries**: Rely on the existing `safeFetch` pattern for standardized error throws.
- **Google API Throttling**: Add small intentional delays inside batch fetching if necessary to avoid API limits.

## Testing
- Ensure the `.env` context properly loads.
- Run a small subset (1 Core or 1 EJ) to test Google Sheets `addRows`.
