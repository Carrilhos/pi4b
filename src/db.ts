import { Pool } from 'pg';

// pool de conexões usado por todos os repositories
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // supabase exige SSL
});
