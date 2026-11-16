import { pool } from '../db';

export async function buscarMonitorPorId(id: number) {
  const resultado = await pool.query<{ id: number; ativo: boolean }>(
    'SELECT id, ativo FROM monitor WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}

// o monitor só atende as disciplinas ligadas a ele em monitor_disciplina
export async function monitorAtendeDisciplina(monitorId: number, disciplinaId: number) {
  const resultado = await pool.query(
    'SELECT 1 FROM monitor_disciplina WHERE monitor_id = $1 AND disciplina_id = $2',
    [monitorId, disciplinaId]
  );
  return resultado.rows.length > 0;
}
