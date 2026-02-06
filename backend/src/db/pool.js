import pkg from "pg";

const { Pool } = pkg;

const isProd = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render exige SSL pour les connexions externes
  ...(isProd && { ssl: { rejectUnauthorized: false } })
});
