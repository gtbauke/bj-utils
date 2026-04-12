# Member Roles History Report Design

This document outlines the design for a new report type that captures the full history of roles for every member of a Junior Enterprise (EJ).

## Context
Currently, the application has a `roles.report.ts` which provides a snapshot of current roles for the year 2026. Users need a way to view all historical roles a member has held, not just their current ones, to track career progression and historical involvement.

## Proposed Changes

### [NEW] [member_roles.report.ts](file:///c:/Users/gusta/dev/bj-utils/src/reports/member_roles.report.ts)
A new report module will be created to handle full history fetching.

#### Technical Details:
- **API Endpoint**: `https://api.brasiljunior.org.br/v1/portal/Ej/${ej.slug}/role_histories`
- **Query Parameters**:
  - `q[s]`: `user_profile_name asc, start_at desc` (Group by member and show roles chronologically).
  - *Note*: Filters for `current_eq` and `start_at` limiters will be removed.
- **Data Transformation**:
  - The report will return a flattened list of roles.
  - Each row represents one role entry for a member.
  - Sorting logic will ensure that if a member had 3 roles, they appear as 3 consecutive rows in the report.

### Column Mapping
The report will include the following columns:
1. **Nome do Membro**: Member's full name.
2. **Email**: Member's email address.
3. **EJ**: Name of the Junior Enterprise.
4. **Núcleo**: Name of the "Núcleo" (Core).
5. **Federação**: Name of the Federation.
6. **Cargo**: Role name (pretty name preferred).
7. **Início**: Start date of the role.
8. **Fim**: End date of the role (null if current).
9. **Atual**: "Sim" if current, "Não" otherwise.
10. **Data do Snapshot**: Current date.

## Design Decisions
- **Isolation**: A separate file is chosen over modifying the existing report to prevent breaking changes and keep the "Snapshot" vs "History" concepts distinct.
- **No Membership Filter**: Unlike the current roles report, we will NOT filter for `closing_term_id === null` because historical roles often belong to memberships that have already officially closed.

## Open Questions
- None at this time based on user feedback.

## Verification
- Run the report for a known EJ with historical data.
- Verify that multiple roles for the same member appear in the output.
- Confirm the `Atual` column correctly identifies current vs past roles.
