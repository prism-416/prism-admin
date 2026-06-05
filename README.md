# Prizmatic Admin

Standalone operator dashboard for Prizmatic service accounts, internal API
tokens, embedding health, and admin audit events.

## Current Problem Statement

Prizmatic helps software teams organize project work, documents, automation,
and internal AI services in one workspace. This repository contains the
admin-facing frontend used by operators to manage internal service accounts,
issue and revoke service API tokens, monitor embedding pipeline health, and
review metadata-only admin audit events.

The database, backend API, authentication rules, and OpenAPI documentation live
in the Prizmatic NestJS backend. This admin app is a Next.js client for those
backend `/admin` endpoints.

## Supported Developer Environments

These instructions are intended to work on the operating systems used by the
team and CI:

- macOS 14+
- Ubuntu 22.04+ or another recent Linux distribution
- Windows 11 with WSL2 Ubuntu
- Windows 11 PowerShell with Node.js and pnpm installed

Use Node.js `20.9` or newer. Node.js `22` LTS is recommended. This project uses
Next.js 16, React 19, TypeScript, Tailwind CSS 4, and pnpm.

## Check Out The Source Code

The latest stable branch is `main`.

```bash
git clone https://github.com/prism-416/prism-admin.git
cd prism-admin
git switch main
git pull origin main
```

There are no release tags in this repository yet. Until the first tagged
release, use `main` for the latest stable integrated code.

## Install Dependencies

macOS, Linux, and WSL2:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

Windows PowerShell:

```powershell
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

For CI or a clean release build, prefer:

```bash
pnpm install --frozen-lockfile
```

## Environment Configuration

The admin app calls the deployed development API by default:

```text
https://api.prizmatic.app/dev
```

Override the backend host with `NEXT_PUBLIC_API_HOST`. Because this value is
bundled into browser code, set it before running `pnpm dev` or `pnpm build`.
Next.js loads `.env.local` from the project root, not from `src/`.

Example `.env.local`:

```text
NEXT_PUBLIC_API_HOST=https://api.prizmatic.app/dev
```

For a local backend:

```text
NEXT_PUBLIC_API_HOST=http://localhost:3000
```

Do not commit `.env.local`; `.env*` files are intentionally ignored.

Admin authentication is handled in the browser session. Enter the operator
password in the app. Requests send it as the `x-admin-password` header, and
mutating forms can send the optional `x-admin-reason` audit header.

This frontend repository does not run a database. For a full local test
environment, run the Prizmatic backend and its PostgreSQL database from:

```text
https://github.com/prism-416/prism-nestjs
```

Follow that backend README for database setup, migrations, and admin password
configuration.

## Run The App Locally

Using the deployed development API:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Using a local backend on port `3000`, run the admin frontend on a different
port.

macOS, Linux, and WSL2:

```bash
NEXT_PUBLIC_API_HOST=http://localhost:3000 pnpm dev --port 3001
```

Windows PowerShell:

```powershell
$env:NEXT_PUBLIC_API_HOST="http://localhost:3000"
pnpm dev --port 3001
```

Open:

```text
http://localhost:3001
```

## Build The Software

Run a production build:

```bash
pnpm build
```

Run the built app:

```bash
pnpm start
```

If the backend is also using port `3000`, start the built admin app on another
port:

```bash
pnpm start --port 3001
```

Set `NEXT_PUBLIC_API_HOST` before the production build so the generated client
bundle points at the correct backend environment.

## Test The Software

Run these checks before opening or merging a pull request:

```bash
pnpm lint
pnpm type-check
pnpm build
```

Current automated frontend coverage is limited to linting, TypeScript checking,
and production build validation. No Jest, Vitest, or Playwright unit test suite
is configured in this repository yet. When frontend unit or end-to-end tests are
added, wire them into `package.json` and update this section with the exact
command.

Manual verification steps for a test development environment:

1. Start either the deployed development API or a local `prism-nestjs` backend.
2. Start this app with the matching `NEXT_PUBLIC_API_HOST`.
3. Open the local admin URL and enter a valid admin password.
4. Verify that the overview dashboard loads service account, token, embedding,
   and audit summaries.
5. Verify service account create, edit, activate, deactivate, and token issue
   workflows using non-production test data.
6. Verify service token search, status filtering, issue, edit, and revoke
   workflows.
7. Verify embedding coverage and job health refresh with stale threshold
   filters.
8. Verify audit event filtering, pagination, and that mutation reasons appear
   in the audit log.
9. File any failures in GitHub Issues before marking the feature verified.

Use throwaway service accounts and service tokens for manual tests. Raw service
tokens are only shown once after issue, so store test tokens only in the
appropriate local or development secret store.

## Routes

- `/`: operations overview
- `/service-accounts`: service account management
- `/service-tokens`: service API token inventory and management
- `/embeddings`: embedding coverage and job health
- `/audit-events`: admin audit event search

## API Design Documentation

This repository does not expose its own backend API routes. The canonical API
design documentation is the Swagger/OpenAPI documentation generated by the
Prizmatic NestJS backend:

- Local backend: `http://localhost:3000/docs`
- Local OpenAPI JSON: `http://localhost:3000/docs-json`
- Deployed development API docs, if enabled: `https://api.prizmatic.app/dev/docs`
- Deployed development OpenAPI JSON: `https://api.prizmatic.app/dev/docs-json`

The admin frontend API client lives in `src/domains/admin/api.ts`, and request
and response types live in `src/domains/admin/types.ts`. Keep those files in
sync with the backend Swagger documentation whenever an endpoint, DTO, response
shape, or auth requirement changes.

The admin dashboard currently targets these backend endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/service-accounts/health` | Service account health summary |
| `GET` | `/admin/service-accounts` | List service accounts |
| `POST` | `/admin/service-accounts` | Create service account |
| `PATCH` | `/admin/service-accounts/:serviceAccountId` | Update service account metadata |
| `POST` | `/admin/service-accounts/:serviceAccountId/activate` | Activate service account |
| `POST` | `/admin/service-accounts/:serviceAccountId/deactivate` | Deactivate service account |
| `GET` | `/admin/service-accounts/:serviceAccountId/api-tokens` | List tokens for one service account |
| `POST` | `/admin/service-accounts/:serviceAccountId/api-tokens` | Create token for one service account |
| `GET` | `/admin/service-api-tokens/health` | Service token health summary |
| `GET` | `/admin/service-api-tokens` | Search token inventory |
| `POST` | `/admin/service-api-tokens` | Issue token and optionally create service account |
| `PATCH` | `/admin/service-api-tokens/:apiTokenId` | Update token metadata, scopes, or expiration |
| `POST` | `/admin/service-api-tokens/:apiTokenId/revoke` | Revoke service token |
| `GET` | `/admin/embeddings/coverage` | Embedding coverage summary |
| `GET` | `/admin/embedding-jobs/health` | Embedding job queue health |
| `GET` | `/admin/audit-events` | Search admin audit events |

All admin requests require `x-admin-password`. Mutating requests may include
`x-admin-reason` for audit context.

The admin dashboard does not call internal worker endpoints directly. It issues,
updates, and revokes the internal bearer tokens that workers use with the
OpenAPI `internal` security scheme. The deployed development OpenAPI JSON
currently documents these internal service-token endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/projects/{projectId}/work-items/internal` | Search work items for internal workers |
| `POST` | `/projects/{projectId}/work-items/internal` | Create work item for internal workers |
| `GET` | `/projects/{projectId}/work-items/internal/{itemId}` | Get work item detail for internal workers |
| `PATCH` | `/projects/{projectId}/work-items/internal/{itemId}` | Update work item for internal workers |
| `DELETE` | `/projects/{projectId}/work-items/internal/{itemId}` | Delete work item for internal workers |
| `GET` | `/projects/{projectId}/work-items/internal/{itemId}/children` | Get work item children for internal workers |
| `PUT` | `/projects/{projectId}/work-items/internal/{itemId}/embedding` | Upsert work item embedding for internal workers |
| `PATCH` | `/projects/{projectId}/work-items/internal/reorder` | Reorder top-level work items for internal workers |
| `GET` | `/workspaces/{workspaceId}/agent-runs/internal/{runId}/state` | Retrieve agent run state for internal workers |
| `PATCH` | `/workspaces/{workspaceId}/agent-runs/internal/{runId}/status` | Update agent run status for internal workers |
| `POST` | `/workspaces/{workspaceId}/agent-runs/internal/{runId}/steps` | Upsert agent run step for internal workers |
| `POST` | `/workspaces/{workspaceId}/agent-runs/internal/{runId}/actions` | Upsert agent action for internal workers |
| `POST` | `/workspaces/{workspaceId}/agent-actions/internal/{actionId}/events` | Create agent action event for internal workers |
| `POST` | `/workspaces/{workspaceId}/embedding-jobs/internal/claim` | Claim queued embedding jobs for internal workers |
| `PATCH` | `/workspaces/{workspaceId}/embedding-jobs/internal/{embeddingJobId}` | Update embedding job status for internal workers |
| `POST` | `/workspaces/{workspaceId}/sprints/internal` | Create sprint for internal workers |
| `PATCH` | `/workspaces/{workspaceId}/sprints/internal/{sprintId}` | Update sprint metadata for internal workers |
| `DELETE` | `/workspaces/{workspaceId}/sprints/internal/{sprintId}` | Delete sprint for internal workers |
| `POST` | `/workspaces/{workspaceId}/sprints/internal/{sprintId}/work-items` | Add work items to sprint for internal workers |
| `DELETE` | `/workspaces/{workspaceId}/sprints/internal/{sprintId}/work-items/{itemId}` | Remove work item from sprint for internal workers |

The service token scope picker is aligned to the current backend scope enum:
`agents:invoke`, `documents:read`, `documents:write`, `embeddings:write`,
`projects:read`, `projects:write`, and `sprints:write`.

## Project Schedule

Detailed assignments and bug ownership should be tracked in GitHub Issues or
the team's project board. Course due dates come from the official course
schedule.

| Milestone | Status | Completed items | Remaining or adjusted items |
| --- | --- | --- | --- |
| Milestone 1 | Completed | Repository setup, Next.js 16 app foundation, TypeScript configuration, baseline admin layout, initial setup documentation | Keep setup docs current as environment requirements change |
| Milestone 2 | Completed | Admin password gate, browser session handling, backend API client, error handling, core routes, overview structure | Continue verifying auth and API failure states through bug reports |
| Milestone 3 | Completed | Service account list, health summary, create/edit/activate/deactivate workflows, service token inventory, issue/edit/revoke workflows, audit reason support | Non-implementer verification should be recorded for completed management workflows |
| Milestone 4 beta | In progress | Operations overview, embedding coverage dashboard, embedding job health dashboard, audit event search, README/API documentation update, bug tracking instructions | Add or confirm the deployed beta admin link, complete the Milestone 4 Progress Update document, file verification bugs, and assign serious bugs |
| Final release | Planned | Not started | Fix serious bugs, expand automated tests if time allows, complete non-implementer verification for all completed features, update API docs, polish the demo, and prepare final release notes |

Schedule adjustments made for the beta:

- The admin frontend scope is focused on operator workflows: service accounts,
  service tokens, embedding health, and admin audit events.
- General project management, sprint, work item, document, and notification
  workflows remain in the main Prizmatic frontend and backend repositories.
- Database setup and backend API design documentation remain owned by the
  NestJS backend repository.
- Final-release time is reserved for deployment verification, bug fixing,
  documentation updates, and test coverage instead of adding large new admin
  feature areas.

## Weekly Milestone Check-In

Before each instructor check-in:

1. Pull the latest `main` branch.
2. Confirm the README, API docs, schedule, and bug tracker are current.
3. Run or review `pnpm lint`, `pnpm type-check`, and `pnpm build`.
4. Demo the completed admin workflows from the deployed beta link or a local
   admin frontend connected to the development backend.
5. Each team member should be ready to state what they completed last week,
   what they plan to do this week, and any blockers.

## Milestone 4 Beta Release Notes

Milestone 4 is the beta checkpoint. The admin app should be accessible from a
deployed link for the in-class demo.

Current backend development API:

```text
https://api.prizmatic.app/dev
```

Current admin beta frontend link:

```text
Add the deployed admin frontend URL here when the beta environment is published.
```

The Milestone 4 Progress Update document should include:

- Each member's scheduled tasks and in-progress tasks.
- Each member's actually completed tasks.
- Partial tasks with completion percentages.
- A group comparison between the original schedule and current beta status.
- The team's progress grade and the reason for that grade.
- Delays, blockers, serious bugs, and schedule adjustments for final release.

Current beta difficulties to account for in the progress update:

- Keeping the admin frontend types synchronized with evolving backend `/admin`
  endpoints.
- Testing token workflows safely because raw tokens are intentionally only
  visible once.
- Verifying embedding and audit dashboards against realistic backend data.
- Completing deployment configuration for the beta admin frontend.

## Bug Tracking And Verification

Outstanding admin frontend bugs are tracked in GitHub Issues:

```text
https://github.com/prism-416/prism-admin/issues
```

To report a bug:

1. Open a new GitHub Issue.
2. Use a clear title that names the affected feature.
3. Include reproduction steps, expected behavior, actual behavior, environment
   details, screenshots or logs when useful, and severity.
4. Add labels such as `bug`, `frontend`, `admin`, or the relevant feature label.
5. Assign serious bugs to a team member and account for the fix in the project
   schedule.

For every feature marked complete, someone who did not implement that feature
should verify it through the deployed beta admin app or a local admin app
connected to the development backend. Any issue found during verification should
be filed in GitHub Issues before the feature is considered ready for final
release.

If a bug belongs to the backend API instead of this frontend, file it in the
backend repository:

```text
https://github.com/prism-416/prism-nestjs/issues
```

## Common Scripts

```bash
# development
pnpm dev

# production
pnpm build
pnpm start

# quality
pnpm lint
pnpm type-check
```
