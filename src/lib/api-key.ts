import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Format: "wkmcp_" + 32 random bytes hex (64 chars). Easy to spot in logs.
const KEY_PREFIX = "wkmcp_";

export function generateApiKey(): { plaintext: string; hash: string } {
  const plaintext = KEY_PREFIX + randomBytes(32).toString("hex");
  return { plaintext, hash: hashApiKey(plaintext) };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Resolve a Bearer token to the user that owns it.
 * Returns null if the key is missing, malformed, unknown, or revoked.
 * Updates `lastUsed` on a successful match (best effort).
 */
export async function authenticate(
  authHeader: string | null,
): Promise<{ userId: string; keyId: string } | null> {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token.startsWith(KEY_PREFIX)) {
    return null;
  }
  const hash = hashApiKey(token);
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } });
  if (!key || key.revokedAt) {
    return null;
  }
  // Best-effort lastUsed update — don't block the request on it.
  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsed: new Date() } })
    .catch(() => {
      // Swallow; auth still succeeded.
    });
  return { userId: key.userId, keyId: key.id };
}
