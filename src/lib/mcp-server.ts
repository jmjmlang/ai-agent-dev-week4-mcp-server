import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Build a fresh McpServer scoped to a single authenticated user.
 *
 * All Person tools include `ownerId: userId` in their where clauses so users
 * can never read or mutate another account's rows, even if they guess an id.
 */
export function createPersonServer(userId: string): McpServer {
  const server = new McpServer({
    name: "ai-agent-dev-week4-person",
    version: "0.1.0",
  });

  server.registerTool(
    "list_people",
    {
      title: "List people",
      description:
        "List all people belonging to the authenticated user, newest first.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(50)
          .describe("Maximum number of rows to return (1-100)."),
      },
    },
    async ({ limit }) => {
      const rows = await prisma.person.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_person",
    {
      title: "Get a person by id",
      description: "Fetch a single person by id. Returns null if not found.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const row = await prisma.person.findFirst({
        where: { id, ownerId: userId },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
      };
    },
  );

  server.registerTool(
    "create_person",
    {
      title: "Create a person",
      description: "Add a new person to the authenticated user's list.",
      inputSchema: {
        name: z.string().min(1),
        email: z.string().email().optional(),
        role: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    async ({ name, email, role, notes }) => {
      const row = await prisma.person.create({
        data: {
          name,
          email: email ?? null,
          role: role ?? null,
          notes: notes ?? null,
          ownerId: userId,
        },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
      };
    },
  );

  server.registerTool(
    "update_person",
    {
      title: "Update a person",
      description:
        "Update fields of an existing person. Only fields you provide are changed.",
      inputSchema: {
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        email: z.string().email().nullable().optional(),
        role: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      },
    },
    async ({ id, ...patch }) => {
      const result = await prisma.person.updateMany({
        where: { id, ownerId: userId },
        data: patch,
      });
      if (result.count === 0) {
        return {
          isError: true,
          content: [
            { type: "text", text: `No person with id ${id} found for you.` },
          ],
        };
      }
      const row = await prisma.person.findUnique({ where: { id } });
      return {
        content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
      };
    },
  );

  server.registerTool(
    "delete_person",
    {
      title: "Delete a person",
      description: "Delete a person you own. Returns true if a row was deleted.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const result = await prisma.person.deleteMany({
        where: { id, ownerId: userId },
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ deleted: result.count > 0 }),
          },
        ],
      };
    },
  );

  return server;
}
