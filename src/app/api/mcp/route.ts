import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticate } from "@/lib/api-key";
import { createPersonServer } from "@/lib/mcp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(message = "Unauthorized") {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="ai-agent-dev-week4-person"',
      },
    },
  );
}

async function handle(req: Request): Promise<Response> {
  const auth = await authenticate(req.headers.get("authorization"));
  if (!auth) {
    return unauthorized("Provide a valid Bearer API key.");
  }

  // Stateless mode: each request gets a fresh transport + server. Simple and
  // works well on serverless. If we need streaming/resumability later, switch
  // to a session-keyed map.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createPersonServer(auth.userId);
  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    // Best-effort cleanup; ignore errors from already-closed transports.
    transport.close().catch(() => {});
    server.close().catch(() => {});
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
