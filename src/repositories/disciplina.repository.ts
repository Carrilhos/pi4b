import { pool } from '../db';

// Devolve a disciplina com o id informado, ou undefined se não existir.
export async function buscarDisciplinaPorId(id: number) {
  const resultado = await pool.query<{ id: number; nome: string }>(
    'SELECT id, nome FROM disciplina WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}
