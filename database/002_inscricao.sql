-- 002_inscricao.sql (tarefa T04)
-- Cria a tabela de inscrições dos alunos nas sessões.
-- Script só com CREATE: pode ser executado uma vez, sem apagar os dados existentes.

CREATE TABLE IF NOT EXISTS inscricao (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sessao_id  INTEGER   NOT NULL REFERENCES sessao(id),
  aluno_id   INTEGER   NOT NULL REFERENCES aluno(id),
  status     TEXT      NOT NULL DEFAULT 'ATIVA',
  criada_em  TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT inscricao_status_valido CHECK (status IN ('ATIVA', 'CANCELADA'))
);

-- Índice único parcial: o mesmo aluno não pode ter duas inscrições ATIVAS na mesma sessão,
-- mas depois de cancelar (status CANCELADA) ele pode se inscrever de novo.
CREATE UNIQUE INDEX IF NOT EXISTS inscricao_unica_ativa
  ON inscricao (sessao_id, aluno_id)
  WHERE status = 'ATIVA';