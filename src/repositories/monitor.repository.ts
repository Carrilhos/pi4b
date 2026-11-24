import { pool } from '../db';

// Devolve o monitor com o id informado, ou undefined se não existir.
export async function buscarMonitorPorId(id: number) {
  const resultado = await pool.query<{ id: number; ativo: boolean }>(
    'SELECT id, ativo FROM monitor WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}

// RN1: verifica se existe o par (monitor, disciplina) em monitor_disciplina.
export async function monitorAtendeDisciplina(monitorId: number, disciplinaId: number) {
  const resultado = await pool.query(
    'SELECT 1 FROM monitor_disciplina WHERE monitor_id = $1 AND disciplina_id = $2',
    [monitorId, disciplinaId]
  );
  return resultado.rows.length > 0;
}
