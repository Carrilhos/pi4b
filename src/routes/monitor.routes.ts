import { Router } from 'express';
import { listarMonitores, buscarMonitor } from '../controllers/monitor.controller';

// Liga cada URL à função do controller.
// A documentação do Swagger fica no comentário @openapi logo acima de cada rota:
// ao alterar uma rota, atualize o comentário dela na mesma alteração.
const router = Router();

/**
 * @openapi
 * /monitores:
 *   get:
 *     summary: Lista os monitores
 *     description: >
 *       Devolve os monitores ordenados pelo nome do aluno, cada um com a lista de ids das
 *       disciplinas que atende. Os filtros são opcionais e podem ser combinados.
 *       Sem resultados, devolve uma lista vazia.
 *     tags: [Monitores]
 *     parameters:
 *       - in: query
 *         name: disciplina
 *         description: Só monitores que atendem esta disciplina (id).
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: ativo
 *         description: Só monitores ativos (true) ou inativos (false).
 *         schema: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Lista de monitores (pode ser vazia).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Monitor' }
 *             example:
 *               - id: 1
 *                 alunoId: 1
 *                 nome: Ana Souza
 *                 ativo: true
 *                 disciplinas: [1, 2]
 *               - id: 2
 *                 alunoId: 2
 *                 nome: Bruno Lima
 *                 ativo: true
 *                 disciplinas: [3]
 *       400:
 *         description: Algum filtro tem valor inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: REQUISICAO_INVALIDA
 *               mensagem: Dados inválidos na requisição.
 *               detalhes:
 *                 - campo: ativo
 *                   problema: deve ser true ou false
 */
router.get('/monitores', listarMonitores);

/**
 * @openapi
 * /monitores/{id}:
 *   get:
 *     summary: Busca um monitor pelo id
 *     description: Devolve o monitor com o nome do aluno e os ids das disciplinas que atende.
 *     tags: [Monitores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador do monitor (inteiro positivo).
 *         schema: { type: integer, minimum: 1, example: 1 }
 *     responses:
 *       200:
 *         description: Monitor encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Monitor' }
 *             example:
 *               id: 1
 *               alunoId: 1
 *               nome: Ana Souza
 *               ativo: true
 *               disciplinas: [1, 2]
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
 *         description: Não existe monitor com esse id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: MONITOR_NAO_ENCONTRADO
 *               mensagem: Monitor 99 não encontrado.
 */
router.get('/monitores/:id', buscarMonitor);

export default router;