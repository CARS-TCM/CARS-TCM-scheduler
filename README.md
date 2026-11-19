# TRACE Release 8 – Staff Training Scheduler (prototype)

A front-end prototype that lets People Managers allocate their team members to approved TRACE Release 8
training sessions by drag and drop, and gives the Training Administrator a dashboard to monitor progress.

**All data is fictional. There are no backend calls and no connection to Microsoft 365, SharePoint, Dataverse
or any HR system.** Role checks in this app run in the browser and are *not* security – see "Production readiness".

## Run it

Requires Node.js 18+.

```bash
npm install
npm run dev          # opens on http://localhost:5173
npm run verify       # 67 logic checks on the business rules (no browser needed)
npm run typecheck    # TypeScript strict mode
npm run build        # production build into dist/
```

Stack: React 18, TypeScript (strict), Tailwind CSS 3, `@dnd-kit/core` for drag and drop, local state + `localStorage`.

## Sample logins

Use **Sample login** in the header (or the two view buttons beneath it).

| Login | Role | Team | Starting position |
|---|---|---|---|
| Priya Nair (M001) | People Manager | Customer Service (7) | Not Started |
| Daniel Okafor (M002) | People Manager | Roads & Drainage (6) | Draft in progress |
| Mei-Lin Tran (M003) | People Manager | Parks & Open Spaces (6) | Not Started, 1 request under review |
| Tom Whitaker (M004) | People Manager | Planning & Approvals (7) | **Confirmed** (read-only) |
| Jordan Ellis | Training Administrator | – | – |

"Reset sample data" in the header restores everything. Data persists across refreshes in your browser only.

## Suggested test script

1. **Allocate** – as Priya, drag Aisha onto *Case Management Deep Dive*. Try the keyboard route too: Tab to the **Move … to** list on a card and choose a session.
2. **Move / unallocate** – drag a card between sessions, then back to *Unallocated team members*.
3. **Capacity** – as Mei-Lin, move Noah into *Foundations – Session 3* (Tom's team already holds 4 of 5 places, so it is *Nearly Full*; Noah takes the last place). Try a second person: the drop is refused with a clear message and the session's option is disabled in the lists.
4. **Undo / draft** – press **Undo last change**, then **Save as draft**. Refresh the browser: allocations remain.
5. **Missing team member** – **Request team member to be added**. Submit it empty to see validation. Submit a valid one: it appears under **My requests** as *Submitted* and does **not** appear on the board.
6. **Submit** – **Confirm and submit…**. The summary lists totals, sessions used, unallocated people and unresolved requests. You must tick the acknowledgement if anyone is unallocated. After submitting the board is read-only; use **Request that the administrator reopen this**.
7. **Admin** – switch to Jordan: review the summary cards; filter by manager / team / session / date / status; open *Session capacity*, *Employee allocations* and *Team member requests*.
8. **Admin actions** – reopen a confirmed submission; make an administrative correction; set a request to *Added* (the person appears in that manager's unallocated list); try *Declined* with no note (a note is required).
9. **Export** – choose an export type and **Download CSV**; it reflects the current filters.
10. **Permissions** – as Daniel you cannot see Priya's people, and Tom (confirmed) cannot move anyone.

## Code structure

```
src/
  data/sampleData.ts        Fictional master data + starting state (no UI imports)
  types.ts                  Shared types
  lib/
    rules.ts                Capacity maths, status labels, per-team statistics (pure)
    actions.ts              Every state change as a pure function with permission + capacity checks
    filters.ts              Admin filters and completion rows
    exports.ts, csv.ts      CSV builders (formula-injection safe) and download helper
    dates.ts                DD/MM/YYYY and local-timezone formatting
  store/AppStore.tsx        React context, localStorage persistence, toasts, sample login
  components/               Layout, Modal/ConfirmDialog (focus trap), Tabs, Toasts, StatusBadge
  manager/                  Board (drag and drop), ReviewDialog, RequestPanels, ManagerView
  admin/                    SummaryCards, FilterBar, CompletionTable, CapacityTable,
                            EmployeeAllocations, RequestsAdmin, ExportPanel, AdminView
scripts/verify.ts           Logic checks (npm run verify)
```

Keeping rules in `lib/actions.ts` as pure functions means the same logic can be moved to a server unchanged.

## Assumptions

- A manager's team is the employees whose Manager ID matches theirs; one manager per team.
- Session capacity is **shared across teams** and draft allocations reserve places immediately. Managers see only their own team's names plus an "other teams" count.
- Sessions are stored as ISO instants and displayed in the viewer's local timezone (shown in the banner).
- "Save as draft" marks the work as saved; working changes are also kept automatically in local storage.
- Administrative corrections can place someone in a session not approved for their team (labelled "override" and audited), but never beyond capacity.
- Reopening a submission keeps existing allocations and sets the status back to Draft.
- In the request form, Team and Manager are pre-filled from the signed-in manager and read-only.
- Marking a request *Added* when the team is already confirmed creates the person, but the submission must be reopened before they can be allocated.
- The date filter uses the browser's native date input (it shows DD/MM/YYYY when the browser locale is Australian).

## Production readiness

| Area | What must change |
|---|---|
| **Authentication** | Replace the sample login with Council single sign-on (e.g. Microsoft Entra ID, OIDC), short-lived tokens, MFA through the identity provider, and server-side sessions. Never trust a role chosen in the browser. |
| **Role-based access** | Derive roles from directory groups or app roles. Map each manager to their team from the HR/org structure (including acting and delegated managers) rather than a field in the client. |
| **Server-side permission enforcement** | Re-implement every rule in `lib/actions.ts` on the server: own-team only, approved sessions only, capacity, read-only once confirmed, admin-only reopen/correct/request review. The API must return only the rows the caller may see. The checks in this prototype can be bypassed in dev tools. |
| **Data storage** | Move master data and working data to an approved platform (database, Dataverse or SharePoint lists, per Council architecture). Keep master data read-only to the app. Use proper keys and constraints (e.g. one allocation per employee). |
| **Concurrency and capacity** | Capacity must be enforced atomically in the database (transaction or conditional update, unique/count constraints) so two managers cannot take the last place. Use optimistic concurrency (row versions/ETags) and show a clear "this just filled up" message. Add idempotent submit and a concurrency lock on submission. |
| **Audit history** | Persist an immutable, server-written log of who did what and when (allocations, drafts, submissions, reopen requests, admin corrections, request decisions, exports) with retention rules. The in-app log here is local and editable. |
| **Privacy** | Collect only needed fields; classify data under Council policy and privacy legislation; encrypt in transit and at rest; restrict and log CSV exports; set retention and deletion; keep real data out of test environments; limit what managers see of other teams to counts only. |
| **Accessibility testing** | Test with NVDA/JAWS/VoiceOver and keyboard only, check WCAG 2.2 AA (contrast, focus, target size, drag alternatives), and involve users of assistive technology. This prototype follows the principles but has had no formal audit. |
| **Integration** | Use approved Council integrations only (identity, HR/org data, calendar invites, email/Teams notifications, TRACE itself) via governed APIs with least-privilege service accounts and a data-sharing agreement. |
| **Operations** | Environments, CI/CD, automated tests (unit, API, accessibility, end to end), monitoring, backups, a security review and penetration test before go-live. |

## Notes on this build

- The pure business rules have 67 automated checks (`npm run verify`).
- The UI was exercised end to end in a headless browser, but with a **stand-in for `@dnd-kit/core`** because the package could not be installed in the build environment. The drop handlers (`onDragEnd`) were tested; the real library's pointer and keyboard dragging, and the Tailwind styling, have **not** been run. Run `npm install && npm run dev` and try both before relying on it.
- Every card also has a **Move … to** list, so allocation never depends on dragging.

## Publishing with GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs the business-rule checks, builds the app and publishes it to
GitHub Pages every time you push to `main`.

One-time setup in your GitHub repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site then appears at `https://YOUR-USERNAME.github.io/YOUR-REPO/` (shown in the Actions run).

Notes:
- The workflow runs `npm install`, so no lock file is required (committing `package-lock.json` is still good practice).
- Free-account Pages sites are public. This prototype contains only fictional data, but do not put real employee data in it.
- Each visitor's allocations are saved in their own browser, not shared between people.
- The type-check step reports problems but does not yet block publishing. When `npm run typecheck` is clean on your
  computer, remove the `continue-on-error: true` line to make it block.
