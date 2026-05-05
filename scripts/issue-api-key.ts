/**
 * CLI: generate an API key for an existing user.
 *
 * Usage:
 *   npx tsx scripts/issue-api-key.ts <userEmail> "<key name>"
 *
 * Prints the plaintext key to stdout exactly once. Store it somewhere safe —
 * only a sha256 hash is kept in the database.
 */
import "dotenv/config";
import { generateApiKey } from "../src/lib/api-key";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !name) {
    console.error('Usage: tsx scripts/issue-api-key.ts <userEmail> "<key name>"');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user with email ${email}. Sign in to the Week 3 app first to create one.`,
    );
    process.exit(2);
  }

  const { plaintext, hash } = generateApiKey();
  const record = await prisma.apiKey.create({
    data: { name, keyHash: hash, userId: user.id },
  });

  console.log("");
  console.log("API key created. Store this value now — it won't be shown again:");
  console.log("");
  console.log("  " + plaintext);
  console.log("");
  console.log(`  id:     ${record.id}`);
  console.log(`  name:   ${record.name}`);
  console.log(`  user:   ${user.email}`);
  console.log("");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
