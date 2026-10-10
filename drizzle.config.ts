import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

// Ensure environment variables from .env.local are loaded when running drizzle-kit directly
config({ path: ".env.local" })

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
  },
})
