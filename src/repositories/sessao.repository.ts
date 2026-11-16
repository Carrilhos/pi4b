import { pool } from '../db';

export type Sessao = {
  id: number;
  monitorId: number;
  monitorNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  inicio: string;
  fim: string;
  local: string;
  vagas: number;
  vagasDisponiveis: number;
  status: string;
};

export type NovaSessao = {
  monitorId: number;
  disciplinaId: number;
  inicio: string;
  fim: string;
  local: string;
  vagas: number;
};

// filtros do GET, todos opcionais
export type FiltrosSessao = {
  disciplina?: number;
  status?: string;
  data?: string;
};

// to_char pra data vir como texto e não como Date (evita problema de fuso)
const CONSULTA_BASE = `
  SELECT s.id,
         s.monitor_id    AS "monitorId",
         a.nome          AS "monitorNome",
         s.disciplina_id AS "disciplinaId",
         d.nome          AS "disciplinaNome",
         to_char(s.inicio, 'YYYY-MM-DD"T"HH24:MI:SS') AS inicio,
         to_char(s.fim,    'YYYY-MM-DD"T"HH24:MI:SS') AS fim,
         s.local,
         s.vagas,
         -- igual a vagas até existir a tabela de inscrições
         s.vagas         AS "vagasDisponiveis",
         s.status
  FROM sessao s
  JOIN monitor m     ON m.id = s.monitor_id
  JOIN aluno a       ON a.id = m.aluno_id
  JOIN disciplina d  ON d.id = s.disciplina_id
`;

export async function listarSessoes(filtros: FiltrosSessao) {
  const condicoes: string[] = [];
  const valores: (string | number)[] = [];

  // só adiciona os filtros que vieram, numerando $1, $2...
  if (filtros.disciplina !== undefined) {
    valores.push(filtros.disciplina);
    condicoes.push('s.disciplina_id = $' + valores.length);
  }
  if (filtros.status !== undefined) {
    valores.push(filtros.status);
    condicoes.push('s.status = $' + valores.length);
  }
  if (filtros.data !== undefined) {
    valores.push(filtros.data);
    condicoes.push('s.inicio::date = $' + valores.length);
  }

  let sql = CONSULTA_BASE;
  if (condicoes.length > 0) {
    sql += ' WHERE ' + condicoes.join(' AND ');
  }
  sql += ' ORDER BY s.inicio, s.id';

  const resultado = await pool.query<Sessao>(sql, valores);
  return resultado.rows;
}

export async function buscarSessaoPorId(id: number) {
  const resultado = await pool.query<Sessao>(CONSULTA_BASE + ' WHERE s.id = $1', [id]);
  return resultado.rows[0];
}

// conflito de horário: sobrepõe se inicio_existente < novo_fim e fim_existente > novo_inicio
export async function buscarConflito(monitorId: number, inicio: string, fim: string) {
  const resultado = await pool.query<{ inicio: string; fim: string }>(
    `SELECT to_char(inicio, 'HH24:MI') AS inicio, to_char(fim, 'HH24:MI') AS fim
     FROM sessao
     WHERE monitor_id = $1
       AND status <> 'CANCELADA'
       AND inicio < $3
       AND fim    > $2
     LIMIT 1`,
    [monitorId, inicio, fim]
  );
  return resultado.rows[0];
}

export async function inserirSessao(dados: NovaSessao) {
  const resultado = await pool.query<{ id: number }>(
    `INSERT INTO sessao (monitor_id, disciplina_id, inicio, fim, local, vagas, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ABERTA')
     RETURNING id`,
    [dados.monitorId, dados.disciplinaId, dados.inicio, dados.fim, dados.local, dados.vagas]
  );
  return resultado.rows[0].id;
}
