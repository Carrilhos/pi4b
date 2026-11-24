import { Router } from 'express';
import { criarSessao, listarSessoes, buscarSessao } from '../controllers/sessao.controller';

// a documentação do swagger fica no @openapi em cima de cada rota
const router = Router();

/**
 * @openapi
 * /sessoes:
 *   get:
 *     summary: Lista as sessões de monitoria
 *     description: >
 *       Devolve as sessões ordenadas por data de início. Os filtros são opcionais
 *       e podem ser combinados (todos precisam ser atendidos). Sem resultados, devolve uma lista vazia.
 *     tags: [Sessões]
 *     parameters:
 *       - in: query
 *         name: disciplina
 *         description: Id da disciplina.
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: status
 *         description: Situação da sessão.
 *         schema: { type: string, enum: [ABERTA, CANCELADA, CONCLUIDA] }
 *       - in: query
 *         name: data
 *         description: Dia de início da sessão, no formato YYYY-MM-DD.
 *         schema: { type: string, format: date, example: '2026-11-21' }
 *     responses:
 *       200:
 *         description: Lista de sessões (pode ser vazia).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Sessao' }
 *             example:
 *               - id: 1
 *                 monitorId: 1
 *                 monitorNome: Ana Souza
 *                 disciplinaId: 1
 *                 disciplinaNome: Banco de Dados
 *                 inicio: '2026-11-20T14:00:00'
 *                 fim: '2026-11-20T15:30:00'
 *                 local: Sala 204, Bloco C
 *                 vagas: 10
 *                 vagasDisponiveis: 10
 *                 status: ABERTA
 *       400:
 *         description: Algum filtro tem valor inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: REQUISICAO_INVALIDA
 *               mensagem: Dados inválidos na requisição.
 *               detalhes:
 *                 - campo: status
 *                   problema: deve ser ABERTA, CANCELADA ou CONCLUIDA
 */
router.get('/sessoes', listarSessoes);

/**
 * @openapi
 * /sessoes:
 *   post:
 *     summary: Cria uma sessão de monitoria
 *     description: >
 *       Cria a sessão com status ABERTA. O monitor precisa existir, estar ativo,
 *       atender a disciplina e não ter outra sessão no mesmo horário.
 *       Sessões que apenas se encostam (uma termina quando a outra começa) são permitidas.
 *     tags: [Sessões]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NovaSessao' }
 *           example:
 *             monitorId: 1
 *             disciplinaId: 1
 *             inicio: '2026-11-21T14:00:00'
 *             fim: '2026-11-21T15:30:00'
 *             local: Sala 204, Bloco C
 *             vagas: 10
 *     responses:
 *       201:
 *         description: Sessão criada.
 *         headers:
 *           Location:
 *             description: Endereço da sessão criada.
 *             schema: { type: string, example: /sessoes/42 }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sessao' }
 *             example:
 *               id: 42
 *               monitorId: 1
 *               monitorNome: Ana Souza
 *               disciplinaId: 1
 *               disciplinaNome: Banco de Dados
 *               inicio: '2026-11-21T14:00:00'
 *               fim: '2026-11-21T15:30:00'
 *               local: Sala 204, Bloco C
 *               vagas: 10
 *               vagasDisponiveis: 10
 *               status: ABERTA
 *       400:
 *         description: Corpo com formato inválido (todos os problemas são listados em detalhes).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: REQUISICAO_INVALIDA
 *               mensagem: Dados inválidos na requisição.
 *               detalhes:
 *                 - campo: local
 *                   problema: obrigatório, texto de 1 a 100 caracteres
 *       404:
 *         description: Monitor ou disciplina não encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               monitor:
 *                 summary: Monitor inexistente
 *                 value:
 *                   erro: MONITOR_NAO_ENCONTRADO
 *                   mensagem: Monitor 99 não encontrado.
 *               disciplina:
 *                 summary: Disciplina inexistente
 *                 value:
 *                   erro: DISCIPLINA_NAO_ENCONTRADA
 *                   mensagem: Disciplina 99 não encontrada.
 *       409:
 *         description: O monitor já tem uma sessão nesse horário.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: CONFLITO_DE_HORARIO
 *               mensagem: O monitor já possui uma sessão entre 14:00 e 15:30 nesta data.
 *       422:
 *         description: Regra de negócio violada (monitor inativo ou não atende a disciplina).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               naoAtende:
 *                 summary: Monitor não atende a disciplina
 *                 value:
 *                   erro: MONITOR_NAO_ATENDE_DISCIPLINA
 *                   mensagem: O monitor não atende esta disciplina.
 *               inativo:
 *                 summary: Monitor inativo
 *                 value:
 *                   erro: MONITOR_INATIVO
 *                   mensagem: O monitor está inativo e não pode criar sessões.
 */
router.post('/sessoes', criarSessao);

export default router;

/**
 * @openapi
 * /sessoes/{id}:
 *   get:
 *     summary: Busca uma sessão pelo id
 *     description: Devolve a sessão completa. É o endereço indicado no header Location do POST /sessoes.
 *     tags: [Sessões]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador da sessão (inteiro positivo).
 *         schema: { type: integer, minimum: 1, example: 1 }
 *     responses:
 *       200:
 *         description: Sessão encontrada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sessao' }
 *             example:
 *               id: 1
 *               monitorId: 1
 *               monitorNome: Ana Souza
 *               disciplinaId: 1
 *               disciplinaNome: Banco de Dados
 *               inicio: "2026-11-20T14:00:00"
 *               fim: "2026-11-20T15:30:00"
 *               local: Sala 204, Bloco C
 *               vagas: 10
 *               vagasDisponiveis: 10
 *               status: ABERTA
 *       400:
 *         description: O id não é um inteiro positivo.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: REQUISICAO_INVALIDA
 *               mensagem: Dados inválidos na requisição.
 *               detalhes:
 *                 - { campo: id, problema: deve ser um inteiro positivo }
 *       404:
 *         description: Não existe sessão com esse id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: SESSAO_NAO_ENCONTRADA
 *               mensagem: Sessão não encontrada.
 */
router.get('/sessoes/:id', buscarSessao);