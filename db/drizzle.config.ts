import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: __dirname + "/migrations",
  schema: __dirname + "/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
