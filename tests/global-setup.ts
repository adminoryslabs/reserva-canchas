import { execSync } from "node:child_process";

// Aplica las migraciones a la base de pruebas (DATABASE_URL de .env.test) antes de correr la suite.
export default function setup() {
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}
