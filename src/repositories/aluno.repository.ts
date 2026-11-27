import { pool } from '../db';

// Devolve o aluno com o id informado, ou undefined se não existir.
export async function buscarAlunoPorId(id: number) {
  const resultado = await pool.query<{ id: number; nome: string }>(
    'SELECT id, nome FROM aluno WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}

// Aluno como a API devolve (sem o e-mail).
export type Aluno = { id: number; nome: string; matricula: string; curso: string };

// Lista todos os alunos, ordenados pelo nome.
export async function listarAlunos() {
  const resultado = await pool.query<Aluno>(
    'SELECT id, nome, matricula, curso FROM aluno ORDER BY nome'
  );
  return resultado.rows;
}