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
