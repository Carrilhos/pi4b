import { Pool } from 'pg';

// Um único Pool para toda a aplicação: ele mantém algumas conexões abertas
// e as reaproveita entre as requisições.
// As credenciais vêm do .env (DATABASE_URL), nunca do código.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Bancos na nuvem exigem conexão com SSL.
  ssl: { rejectUnauthorized: false },
});
