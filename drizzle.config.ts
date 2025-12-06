import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema.ts', // adjust to where your schema file is
  out: './drizzle',
  connectionString: process.env.DATABASE_URL,
});
