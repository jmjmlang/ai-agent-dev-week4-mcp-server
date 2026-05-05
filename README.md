# ai-agent-dev-week4-mcp-server

An MCP (Model Context Protocol) server that exposes the Week 3 Person App
database as tools an AI agent can call. Week 4 deliverable for the Ausbiz
AI Agent Developer workshop.

Stack: Next.js 16 (App Router, Node runtime), TypeScript, Prisma 7,
`@modelcontextprotocol/sdk`, Neon Postgres (shared with Week 3), Vercel.

## What it does

Exposes a single HTTP endpoint at `/api/mcp` speaking the Streamable HTTP
MCP transport. Clients authenticate with a Bearer API key. Each key is bound
to one User row, and every tool query is scoped by `ownerId`, so a key
holder can only read or write the people that user owns.

## Tools

- `list_people(limit?)` — list of people, newest first.
- `get_person(id)` — single row by id.
- `create_person(name, email?, role?, notes?)` — add a row.
- `update_person(id, ...fields)` — patch a row.
- `delete_person(id)` — delete a row by id.

## Run it locally

```powershell
npm install
# .env needs DATABASE_URL pointing at the Week 3 Neon database
npx prisma db push
npm run dev
```

The server listens on `http://localhost:3000/api/mcp`.

### Issue an API key

The user must already exist in the database (sign in to the Week 3 app
once first to create the User row).

```powershell
npm run issue-key -- you@example.com "my laptop"
```

The plaintext key is printed once. Only its sha256 hash is stored.

### Smoke test

```powershell
$k = "wkmcp_..."   # the key from issue-key
curl.exe -X POST http://localhost:3000/api/mcp `
  -H "Authorization: Bearer $k" `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Wiring it up to a client

- **VS Code**: copy `.vscode/mcp.json` into the workspace where you want the
  tools available. VS Code will prompt for the API key on first use.
- **Claude Desktop**: `mcp-configs/claude-desktop-config.json` is the
  equivalent setup using the `mcp-remote` adapter (Claude Desktop only
  speaks stdio natively).

## Deploy notes

Deploys cleanly to Vercel; Node runtime, no edge functions. Required env
vars: `DATABASE_URL`. The schema is kept in sync with `prisma db push` (the
existing Auth.js + Person tables came from Week 3; this project only adds
the `ApiKey` table).
