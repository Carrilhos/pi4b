import { pool } from '../db';

// Devolve a disciplina com o id informado, ou undefined se não existir.
export async function buscarDisciplinaPorId(id: number) {
  const resultado = await pool.query<{ id: number; nome: string }>(
    'SELECT id, nome FROM disciplina WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}

// Disciplina como a API devolve.
export type Disciplina = { id: number; codigo: string; nome: string };

// Lista todas as disciplinas, ordenadas pelo código.
export async function listarDisciplinas() {
  const resultado = await pool.query<Disciplina>(
    'SELECT id, codigo, nome FROM disciplina ORDER BY codigo'
  );
  return resultado.rows;
}