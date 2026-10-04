import { execSync } from "node:child_process";

/**
 * Creates a clean schema in TEST_DATABASE_URL before the integration suite.
 * The database is WIPED — never point this at a real store database.
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set. Integration tests need a disposable PostgreSQL database.");
  }
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
