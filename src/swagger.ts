import swaggerJsdoc from 'swagger-jsdoc';

// junta essas infos com os comentários @openapi das rotas
export const especificacao = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Monitorias Acadêmicas',
      version: '1.0.0',
      description:
        'API REST da Plataforma de Monitorias Acadêmicas (UCPel - ADS). ' +
        'Permite cadastrar e consultar sessões de monitoria. ' +
        'Datas sempre no formato YYYY-MM-DDTHH:MM:SS, sem fuso horário.',
    },
    // schemas usados nas rotas via $ref
    components: {
      schemas: {
        Sessao: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 42 },
            monitorId: { type: 'integer', example: 1 },
            monitorNome: { type: 'string', example: 'Ana Souza' },
            disciplinaId: { type: 'integer', example: 1 },
            disciplinaNome: { type: 'string', example: 'Banco de Dados' },
            inicio: { type: 'string', example: '2026-11-21T14:00:00' },
            fim: { type: 'string', example: '2026-11-21T15:30:00' },
            local: { type: 'string', example: 'Sala 204, Bloco C' },
            vagas: { type: 'integer', example: 10 },
            vagasDisponiveis: {
              type: 'integer',
              example: 10,
              description: 'Por enquanto é igual a vagas (as inscrições ainda não existem).',
            },
            status: { type: 'string', enum: ['ABERTA', 'CANCELADA', 'CONCLUIDA'], example: 'ABERTA' },
          },
        },
        NovaSessao: {
          type: 'object',
          required: ['monitorId', 'disciplinaId', 'inicio', 'fim', 'local', 'vagas'],
          properties: {
            monitorId: { type: 'integer', minimum: 1, example: 1 },
            disciplinaId: { type: 'integer', minimum: 1, example: 1 },
            inicio: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$',
              example: '2026-11-21T14:00:00',
              description: 'Sem fuso horário e sem milissegundos.',
            },
            fim: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$',
              example: '2026-11-21T15:30:00',
              description: 'Deve ser maior que inicio.',
            },
            local: { type: 'string', maxLength: 100, example: 'Sala 204, Bloco C' },
            vagas: { type: 'integer', minimum: 1, example: 10 },
          },
        },
        Erro: {
          type: 'object',
          properties: {
            erro: { type: 'string', example: 'CONFLITO_DE_HORARIO' },
            mensagem: { type: 'string', example: 'O monitor já possui uma sessão entre 14:00 e 15:30 nesta data.' },
            detalhes: {
              type: 'array',
              description: 'Presente apenas nos erros 400.',
              items: {
                type: 'object',
                properties: {
                  campo: { type: 'string', example: 'vagas' },
                  problema: { type: 'string', example: 'deve ser um inteiro maior que zero' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
