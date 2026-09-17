# Local CSV Output Design

Implement a "Local Mode" for the BJ Utils CLI that allows users to save report data directly to CSV files instead of appending them to Google Sheets.

## User Review Required

> [!IMPORTANT]
> The local mode is triggered by a CLI flag (`--local` or `-l`). This will skip the requirement for Google Sheets credentials in the `.env` file for those specific runs.

## Proposed Changes

### Configuration & Context

#### [MODIFY] [constants.utils.ts](file:///c:/Users/gusta/dev/bj-utils/src/utils/requests/constants.utils.ts)
- Add `OUTPUT_MODE_CONTEXT_KEY = "OUTPUT_MODE"`.

#### [MODIFY] [context.utils.ts](file:///c:/Users/gusta/dev/bj-utils/src/utils/requests/context.utils.ts)
- No changes needed to the class itself, but it will be used to store the output mode.

### CLI Entry Point

#### [MODIFY] [index.ts](file:///c:/Users/gusta/dev/bj-utils/src/index.ts)
- Parse `process.argv` to check for `--local` or `-l`.
- If present, set `OUTPUT_MODE_CONTEXT_KEY` to `"local"` in the `RequestContext`.
- Log that local mode is enabled.

### CSV Storage Utility

#### [NEW] [csv.utils.ts](file:///c:/Users/gusta/dev/bj-utils/src/utils/csv.utils.ts)
- Function `saveReportToCsv(title: string, data: Record<string, string | number>[])`:
    - Ensure `outputs/` directory exists using `fs.mkdirSync`.
    - Generate filename: `outputs/${title}_${timestamp}.csv`.
    - Convert JSON array to CSV string:
        - Use keys of `data[0]` as headers.
        - Escape values containing commas or newlines with double quotes.
    - Write to file using `fs.writeFileSync`.

### Report Execution Branching

#### [MODIFY] [reports.action.ts](file:///c:/Users/gusta/dev/bj-utils/src/actions/reports.action.ts)
- In `executeReportInContext`:
    - Check `context.get(OUTPUT_MODE_CONTEXT_KEY)`.
    - If `"local"`, call `saveReportToCsv(sheetTitle, allData)`.
    - Otherwise, call `appendRowsToSheet(context, sheetTitle, allData)`.
    - Handle missing Google Sheets credentials gracefully only if NOT in local mode.

## Verification Plan

### Automated Tests
- None planned for this change (CLI tool).

### Manual Verification
1. Run a report with the `--local` flag: `npm start -- --local`.
2. Verify that a `.csv` file is created in the `outputs/` folder.
3. Verify that the CSV content matches the expected headers and data.
4. Verify that running without the flag still attempts to write to Google Sheets.
