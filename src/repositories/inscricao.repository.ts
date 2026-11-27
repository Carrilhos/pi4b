import { pool } from '../db';

// Campos devolvidos ao cliente, já em camelCase e com a data em texto (sem objeto Date).
const CAMPOS_INSCRICAO = `
  id,
  sessao_id AS "sessaoId",
  aluno_id AS "alunoId",
  status,
  to_char(criada_em, 'YYYY-MM-DD"T"HH24:MI:SS') AS "criadaEm"
`;

// O aluno é o monitor desta sessão? (o monitor não pode se inscrever na própria sessão)
export async function alunoEhMonitorDaSessao(sessaoId: number, alunoId: number): Promise<boolean> {
  const resultado = await pool.query(
    `SELECT 1
     FROM sessao s
     JOIN monitor m ON m.id = s.monitor_id
     WHERE s.id = $1 AND m.aluno_id = $2`,
    [sessaoId, alunoId]
  );
  return resultado.rows.length > 0;
}

// O aluno já tem inscrição ATIVA nesta sessão?
export async function existeInscricaoAtiva(sessaoId: number, alunoId: number): Promise<boolean> {
  const resultado = await pool.query(
    `SELECT 1 FROM inscricao
     WHERE sessao_id = $1 AND aluno_id = $2 AND status = 'ATIVA'`,
    [sessaoId, alunoId]
  );
  return resultado.rows.length > 0;
}

// Insere a inscrição SOMENTE se ainda houver vaga: a conta de vagas e o INSERT
// acontecem no mesmo comando. Se não houver vaga, nada é inserido e devolve undefined.
export async function inserirInscricaoSeHouverVaga(sessaoId: number, alunoId: number) {
  const resultado = await pool.query(
    `INSERT INTO inscricao (sessao_id, aluno_id)
     SELECT $1::int, $2::int
     WHERE (SELECT vagas FROM sessao WHERE id = $1)
         > (SELECT COUNT(*) FROM inscricao WHERE sessao_id = $1 AND status = 'ATIVA')
     RETURNING ${CAMPOS_INSCRICAO}`,
    [sessaoId, alunoId]
  );
  return resultado.rows[0];
}