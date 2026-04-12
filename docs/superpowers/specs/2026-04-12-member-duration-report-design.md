# Member Duration Report Design

This report calculates the total time a member has stayed in their Junior Enterprise (EJ) based on their official membership history.

## Problem Statement
Users need to know how long members have been part of an EJ to track retention, calculate average tenure, and identify long-standing members. Existing reports show current roles or role history but don't provide a direct "Total Days" calculation.

## Proposed Solution
Create a new report that aggregates a member's `memberships` data to determine their earliest entry date, latest exit date (or current), and the resulting total days of stay.

## Implementation Details

### Data Fetching
- **Endpoint**: `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/user_profiles`
- **Parameters**: 
  - Standard filters to include members, trainees, and admins.
  - Sorting by `created_at desc`.
- **Fields Needed**: `name`, `email`, `cpf`, `memberships`, `current_role_histories`.

### Calculation Logic
For each member record:
1.  **Parse Memberships**: Access the `memberships` array.
2.  **Find Boundaries**:
    - `earliest_start`: `Math.min(...memberships.map(m => new Date(m.start_at)))`
    - `latest_end`: `Math.max(...memberships.map(m => m.end_at ? new Date(m.end_at) : new Date()))`
    - If any `membership.end_at` is `null`, the member is considered **Current**, and the `latest_end` defaults to today's date.
3.  **Compute Duration**:
    - `total_days = Math.floor((latest_end - earliest_start) / (1000 * 60 * 60 * 24))`
4.  **Status Determination**:
    - If any `membership.end_at` is `null`, Status = "Ativo".
    - Otherwise, Status = "Desligado".

### File Structure
- **New File**: `src/reports/member_duration.report.ts`
- **Exported Function**: `fetchMemberDurationForEJ(ej: any, context: RequestContext)`

### Data Schema (Report Columns)
| Column Name | Source / Logic |
| :--- | :--- |
| Nome | `member.name` |
| Email | `member.email` |
| CPF | `member.cpf` |
| EJ | `ej.name` |
| Núcleo | `context.get("cores")` lookup |
| Federação | `context.get("cores")` lookup |
| Status | "Ativo" or "Desligado" |
| Data de Entrada | `earliest_start` (YYYY-MM-DD) |
| Última Data de Saída | `latest_end` (YYYY-MM-DD) or "Ativo" |
| Total de Dias | `total_days` |
| Data do Snapshot | Current Date |

## Success Criteria
- The report generates a CSV/Sheet with accurate "Total de Dias" for both past and current members.
- Members who left and returned are calculated from their first ever start date to their most recent end date (or now).
- Edge cases (e.g., membership with no end date) are handled gracefully.

## Verification Plan
- **Manual Test**: Run the report against an EJ with known long-term and short-term members.
- **Visual Check**: Verify that "Total de Dias" matches the difference between "Data de Entrada" and "Data de Saída".
