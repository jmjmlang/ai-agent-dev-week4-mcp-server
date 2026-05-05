export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 space-y-6 font-sans">
      <p className="text-sm uppercase tracking-wider text-zinc-500">
        Week 4 · MCP Server
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">
        Person MCP Server
      </h1>
      <p className="text-lg text-zinc-600">
        This is the HTTP MCP endpoint that exposes the Week 3 Person database
        as tools an AI agent can call. There is no UI here — point an MCP
        client at <code className="rounded bg-zinc-100 px-1.5 py-0.5">/api/mcp</code>{" "}
        with a Bearer API key.
      </p>
      <pre className="overflow-x-auto rounded-md bg-zinc-900 p-4 text-sm text-zinc-100">
        {`POST /api/mcp
Authorization: Bearer wkmcp_<your-key>
Content-Type: application/json

{ "jsonrpc": "2.0", "id": 1, "method": "tools/list" }`}
      </pre>
      <p className="text-sm text-zinc-500">
        Tools: list_people, get_person, create_person, update_person,
        delete_person.
      </p>
    </main>
  );
}
