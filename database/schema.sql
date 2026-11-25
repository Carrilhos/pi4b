//TODO - Arrumar esse arquivo - Eu, Gabriel, juntei o schema durante o rebase

-- Schema da entrega parcial (PostgreSQL)
-- Cuidado: rodar este arquivo apaga as tabelas e cria de novo.

DROP TABLE IF EXISTS sessao             CASCADE;
DROP TABLE IF EXISTS monitor_disciplina CASCADE;
DROP TABLE IF EXISTS monitor            CASCADE;
DROP TABLE IF EXISTS disciplina         CASCADE;
DROP TABLE IF EXISTS aluno              CASCADE;

CREATE TABLE aluno (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    matricula  TEXT NOT NULL UNIQUE,
    curso      TEXT NOT NULL
);

CREATE TABLE disciplina (
    id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo  TEXT NOT NULL UNIQUE,
    nome    TEXT NOT NULL
);

CREATE TABLE monitor (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id  INTEGER NOT NULL UNIQUE REFERENCES aluno(id),
    ativo     BOOLEAN NOT NULL DEFAULT TRUE
);

-- disciplinas que cada monitor pode atender
CREATE TABLE monitor_disciplina (
    monitor_id    INTEGER NOT NULL REFERENCES monitor(id)    ON DELETE CASCADE,
    disciplina_id INTEGER NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    PRIMARY KEY (monitor_id, disciplina_id)
);

CREATE TABLE sessao (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    monitor_id    INTEGER   NOT NULL REFERENCES monitor(id),
    disciplina_id INTEGER   NOT NULL REFERENCES disciplina(id),
    inicio        TIMESTAMP NOT NULL,
    fim           TIMESTAMP NOT NULL,
    local         TEXT      NOT NULL,
    vagas         INTEGER   NOT NULL CHECK (vagas > 0),
    status        TEXT      NOT NULL DEFAULT 'ABERTA'
                  CHECK (status IN ('ABERTA', 'CANCELADA', 'CONCLUIDA')),
    CHECK (fim > inicio)
);

CREATE INDEX idx_sessao_disciplina_status ON sessao (disciplina_id, status);
CREATE INDEX idx_sessao_monitor_horario   ON sessao (monitor_id, inicio, fim);

-- dados de exemplo

INSERT INTO aluno (nome, email, matricula, curso) VALUES
    ('Ana Souza',    'ana.souza@exemplo.edu.br',    '20230001', 'Análise e Desenvolvimento de Sistemas'),
    ('Bruno Lima',   'bruno.lima@exemplo.edu.br',   '20230002', 'Análise e Desenvolvimento de Sistemas'),
    ('Carla Mendes', 'carla.mendes@exemplo.edu.br', '20230003', 'Análise e Desenvolvimento de Sistemas'),
    ('Diego Rocha',  'diego.rocha@exemplo.edu.br',  '20240004', 'Análise e Desenvolvimento de Sistemas');

INSERT INTO disciplina (codigo, nome) VALUES
    ('ADS101', 'Banco de Dados'),
    ('ADS102', 'Programação Orientada a Objetos'),
    ('ADS103', 'Arquitetura de Sistemas');

-- Ana e Bruno são monitores
INSERT INTO monitor (aluno_id, ativo) VALUES
    (1, TRUE),
    (2, TRUE);

-- Ana: Banco de Dados e POO / Bruno: Arquitetura
INSERT INTO monitor_disciplina (monitor_id, disciplina_id) VALUES
    (1, 1),
    (1, 2),
    (2, 3);

-- sessão da Ana pra testar o 409: tenta criar outra no mesmo horário
INSERT INTO sessao (monitor_id, disciplina_id, inicio, fim, local, vagas, status) VALUES
    (1, 1, '2026-11-20T14:00:00', '2026-11-20T15:30:00', 'Sala 204, Bloco C', 10, 'ABERTA');
-- schema.sql
-- Estrutura do banco da Plataforma de Monitorias Acadêmicas (PostgreSQL).
--
-- ATENÇÃO: este arquivo é só documentação. O banco já existe na nuvem (Supabase)
-- com as tabelas e os dados de exemplo. Não execute este arquivo no banco em uso.
-- Tabelas novas entram em scripts numerados (ex.: 002_inscricao.sql).

-- Necessária para a restrição de sobreposição da tabela sessao
-- (permite usar "=" em inteiros dentro de um EXCLUDE USING gist).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ========== Módulo Acadêmico ==========

CREATE TABLE aluno (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  matricula  TEXT NOT NULL UNIQUE,
  curso      TEXT NOT NULL
);

CREATE TABLE disciplina (
  id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE,
  nome    TEXT NOT NULL
);

-- ========== Módulo Monitorias ==========

-- Um monitor é um aluno (relação 1 para 0..1).
CREATE TABLE monitor (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aluno_id  INTEGER NOT NULL UNIQUE REFERENCES aluno(id),
  ativo     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Disciplinas que cada monitor atende (relação N:N). Base da regra RN1.
CREATE TABLE monitor_disciplina (
  monitor_id     INTEGER NOT NULL REFERENCES monitor(id),
  disciplina_id  INTEGER NOT NULL REFERENCES disciplina(id),
  PRIMARY KEY (monitor_id, disciplina_id)
);

CREATE TABLE sessao (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  monitor_id     INTEGER   NOT NULL REFERENCES monitor(id),
  disciplina_id  INTEGER   NOT NULL REFERENCES disciplina(id),
  inicio         TIMESTAMP NOT NULL,
  fim            TIMESTAMP NOT NULL,
  local          TEXT      NOT NULL,
  vagas          INTEGER   NOT NULL,
  status         TEXT      NOT NULL DEFAULT 'ABERTA',
  CONSTRAINT sessao_fim_depois_do_inicio CHECK (fim > inicio),
  CONSTRAINT sessao_vagas_positivas      CHECK (vagas > 0),
  CONSTRAINT sessao_status_valido        CHECK (status IN ('ABERTA', 'CANCELADA', 'CONCLUIDA')),
  -- RN2: o mesmo monitor não pode ter duas sessões sobrepostas (as canceladas são ignoradas).
  -- O intervalo é [inicio, fim), então sessões que apenas se encostam são permitidas.
  CONSTRAINT sessao_sem_sobreposicao EXCLUDE USING gist (
    monitor_id WITH =,
    tsrange(inicio, fim) WITH &&
  ) WHERE (status <> 'CANCELADA')
);

-- Inscrições dos alunos nas sessões (script 002_inscricao.sql).
CREATE TABLE inscricao (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sessao_id  INTEGER   NOT NULL REFERENCES sessao(id),
  aluno_id   INTEGER   NOT NULL REFERENCES aluno(id),
  status     TEXT      NOT NULL DEFAULT 'ATIVA',
  criada_em  TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT inscricao_status_valido CHECK (status IN ('ATIVA', 'CANCELADA'))
);

-- Um aluno não pode ter duas inscrições ATIVAS na mesma sessão,
-- mas pode se inscrever de novo depois de cancelar.
CREATE UNIQUE INDEX inscricao_unica_ativa
  ON inscricao (sessao_id, aluno_id)
  WHERE status = 'ATIVA';


-- ========== Dados de exemplo (já inseridos no banco) ==========
-- Alunos 1 a 4; disciplinas 1 a 3; monitor 1 (Ana: disciplinas 1 e 2);
-- monitor 2 (Bruno: disciplina 3); sessão 1 em 20/11/2026, das 14:00 às 15:30.
--
-- INSERT INTO aluno (nome, email, matricula, curso) VALUES
--   ('Ana Souza',    'ana.souza@exemplo.edu.br',    '20230001', 'Análise e Desenvolvimento de Sistemas'),
--   ('Bruno Lima',   'bruno.lima@exemplo.edu.br',   '20230002', 'Análise e Desenvolvimento de Sistemas'),
--   ('Carla Mendes', 'carla.mendes@exemplo.edu.br', '20230003', 'Análise e Desenvolvimento de Sistemas'),
--   ('Diego Rocha',  'diego.rocha@exemplo.edu.br',  '20240004', 'Análise e Desenvolvimento de Sistemas');
-- INSERT INTO disciplina (codigo, nome) VALUES
--   ('ADS101', 'Banco de Dados'), ('ADS102', 'POO'), ('ADS103', 'Arquitetura de Sistemas');
-- INSERT INTO monitor (aluno_id) VALUES (1), (2);
-- INSERT INTO monitor_disciplina (monitor_id, disciplina_id) VALUES (1, 1), (1, 2), (2, 3);
-- INSERT INTO sessao (monitor_id, disciplina_id, inicio, fim, local, vagas)
--   VALUES (1, 1, '2026-11-20 14:00:00', '2026-11-20 15:30:00', 'Sala 204, Bloco C', 10);
