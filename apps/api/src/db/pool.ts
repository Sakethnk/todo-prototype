import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "todo",
  user: "postgres",
  password: process.env.DB_PASSWORD
});
