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
// Monitor como a API devolve (camelCase), com os ids das disciplinas que atende.
export type Monitor = {
  id: number;
  alunoId: number;
  nome: string;
  ativo: boolean;
  disciplinas: number[];
};

// Filtros opcionais do GET /monitores.
export type FiltrosMonitor = {
  disciplina?: number;
  ativo?: boolean;
};

// Consulta base: junta monitor e aluno (para o nome) e reúne os ids das disciplinas em uma lista.
// Se o monitor não atende nenhuma disciplina, a lista vem vazia.
const CONSULTA_MONITOR = `
  SELECT m.id,
         m.aluno_id AS "alunoId",
         a.nome,
         m.ativo,
         COALESCE(
           (SELECT array_agg(md.disciplina_id ORDER BY md.disciplina_id)
            FROM monitor_disciplina md
            WHERE md.monitor_id = m.id),
           '{}'::int[]
         ) AS disciplinas
  FROM monitor m
  JOIN aluno a ON a.id = m.aluno_id
`;

// Lista os monitores aplicando só os filtros que vieram preenchidos, ordenados pelo nome.
export async function listarMonitores(filtros: FiltrosMonitor) {
  const condicoes: string[] = [];
  const valores: (number | boolean)[] = [];

  // Para cada filtro: guarda o valor e usa a posição dele ($1, $2...) na condição.
  if (filtros.disciplina !== undefined) {
    valores.push(filtros.disciplina);
    condicoes.push(
      'EXISTS (SELECT 1 FROM monitor_disciplina f WHERE f.monitor_id = m.id AND f.disciplina_id = $' + valores.length + ')'
    );
  }
  if (filtros.ativo !== undefined) {
    valores.push(filtros.ativo);
    condicoes.push('m.ativo = $' + valores.length);
  }

  const where = condicoes.length > 0 ? ' WHERE ' + condicoes.join(' AND ') : '';
  const resultado = await pool.query<Monitor>(CONSULTA_MONITOR + where + ' ORDER BY a.nome, m.id', valores);
  return resultado.rows;
}

// Busca um monitor completo pelo id. Devolve undefined se não existir.
export async function buscarMonitorComDisciplinas(id: number) {
  const resultado = await pool.query<Monitor>(CONSULTA_MONITOR + ' WHERE m.id = $1', [id]);
  return resultado.rows[0];
}