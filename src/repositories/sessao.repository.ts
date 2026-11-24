import { pool } from '../db';

// Formato de uma sessão como a API devolve (camelCase).
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

// Dados que chegam no POST /sessoes.
export type NovaSessao = {
  monitorId: number;
  disciplinaId: number;
  inicio: string;
  fim: string;
  local: string;
  vagas: number;
};

// Filtros opcionais do GET /sessoes.
export type FiltrosSessao = {
  disciplina?: number;
  status?: string;
  data?: string;
};

// Consulta base: junta sessão, monitor, aluno e disciplina para montar o objeto Sessao.
// As datas são convertidas para texto aqui no SQL para evitar problemas de fuso horário
// (assim o pg não cria objetos Date).
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
         -- Por enquanto é igual a "vagas": será trocado pelo cálculo real
         -- quando a tabela de inscrições existir.
         s.vagas         AS "vagasDisponiveis",
         s.status
  FROM sessao s
  JOIN monitor m     ON m.id = s.monitor_id
  JOIN aluno a       ON a.id = m.aluno_id
  JOIN disciplina d  ON d.id = s.disciplina_id
`;

// Lista as sessões aplicando só os filtros que vieram preenchidos.
export async function listarSessoes(filtros: FiltrosSessao) {
  const condicoes: string[] = [];
  const valores: (string | number)[] = [];

  // Para cada filtro: guarda o valor e usa a posição dele ($1, $2...) na condição.
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

// Busca uma sessão completa pelo id (usado para devolver a sessão recém-criada).
export async function buscarSessaoPorId(id: number) {
  const resultado = await pool.query<Sessao>(CONSULTA_BASE + ' WHERE s.id = $1', [id]);
  return resultado.rows[0];
}

// RN2: procura uma sessão do mesmo monitor que se sobreponha ao novo horário.
// Dois intervalos se sobrepõem quando inicio_existente < novo_fim E fim_existente > novo_inicio.
// Sessões canceladas não contam. Devolve os horários (HH:MM) da sessão em conflito.
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

// Insere a sessão já com status ABERTA e devolve o id gerado pelo banco.
export async function inserirSessao(dados: NovaSessao) {
  const resultado = await pool.query<{ id: number }>(
    `INSERT INTO sessao (monitor_id, disciplina_id, inicio, fim, local, vagas, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ABERTA')
     RETURNING id`,
    [dados.monitorId, dados.disciplinaId, dados.inicio, dados.fim, dados.local, dados.vagas]
  );
  return resultado.rows[0].id;
}
