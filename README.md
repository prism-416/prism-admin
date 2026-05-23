# Prizmatic Admin

Standalone operator dashboard for Prizmatic service accounts, internal API tokens, embedding health, and admin audit events.

## Getting Started

Install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

The app defaults to `https://api.prizmatic.app/dev`. Override it when needed:

```bash
NEXT_PUBLIC_API_HOST=http://localhost:3000 pnpm dev
```

Admin authentication is handled in the browser session. Enter the operator password in the app; requests send it as the `x-admin-password` header. Mutating forms also support the optional `x-admin-reason` audit header.

## Scripts

```bash
pnpm lint
pnpm type-check
pnpm build
```

## Routes

- `/` overview
- `/service-accounts`
- `/service-tokens`
- `/embeddings`
- `/audit-events`

## API Surface

The dashboard targets the existing NestJS `/admin` endpoints:

- service account health and management
- service API token health, inventory, issue, update, and revoke
- embedding coverage and job health
- admin audit event search
