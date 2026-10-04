/* eslint-disable no-console */
/**
 * Create or reset an admin account without re-seeding the store.
 *   npm run admin:create -- owner@example.com "a-strong-password" "Owner name"
 * Falls back to ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/crypto";

const db = new PrismaClient();

async function main() {
  const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
  const email = (emailArg ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = passwordArg ?? process.env.ADMIN_PASSWORD ?? "";
  const name = nameArg ?? process.env.ADMIN_NAME ?? "مدير المتجر";
  if (!email.includes("@")) throw new Error("Provide a valid email (argument or ADMIN_EMAIL).");
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");
  const passwordHash = await hashPassword(password);
  await db.adminUser.upsert({ where: { email }, create: { email, name, passwordHash }, update: { passwordHash, name } });
  await db.adminSession.deleteMany({ where: { admin: { email } } }); // sign out old sessions
  console.log(`✓ Admin ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
