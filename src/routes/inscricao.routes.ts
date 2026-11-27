import { Router } from 'express';
import { criarInscricao } from '../controllers/inscricao.controller';

// Liga cada URL à função do controller.
// A documentação do Swagger fica no comentário @openapi logo acima de cada rota.
const router = Router();

/**
 * @openapi
 * /sessoes/{id}/inscricoes:
 *   post:
 *     summary: Inscreve um aluno em uma sessão
 *     description: >
 *       Cria uma inscrição ATIVA. A sessão precisa estar ABERTA e ter vaga, o aluno não pode ser o
 *       monitor da sessão nem já estar inscrito. Enquanto não há login, o alunoId vem no corpo.
 *     tags: [Inscrições]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador da sessão (inteiro positivo).
 *         schema: { type: integer, minimum: 1, example: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alunoId]
 *             properties:
 *               alunoId: { type: integer, minimum: 1, example: 3 }
 *           example:
 *             alunoId: 3
 *     responses:
 *       201:
 *         description: Inscrição criada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Inscricao' }
 *             example:
 *               id: 1
 *               sessaoId: 1
 *               alunoId: 3
 *               status: ATIVA
 *               criadaEm: '2026-11-24T15:30:00'
 *       400:
 *         description: Id da sessão ou corpo com formato inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example:
 *               erro: REQUISICAO_INVALIDA
 *               mensagem: Dados inválidos na requisição.
 *               detalhes:
 *                 - campo: alunoId
 *                   problema: obrigatório, deve ser um inteiro maior que zero
 *       404:
 *         description: Sessão ou aluno não encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               sessao:
 *                 summary: Sessão inexistente
 *                 value:
 *                   erro: SESSAO_NAO_ENCONTRADA
 *                   mensagem: Sessão não encontrada.
 *               aluno:
 *                 summary: Aluno inexistente
 *                 value:
 *                   erro: ALUNO_NAO_ENCONTRADO
 *                   mensagem: Aluno 99 não encontrado.
 *       409:
 *         description: O aluno já está inscrito ou a sessão não tem mais vagas.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               jaInscrito:
 *                 summary: Aluno já inscrito
 *                 value:
 *                   erro: JA_INSCRITO
 *                   mensagem: O aluno já está inscrito nesta sessão.
 *               semVagas:
 *                 summary: Sem vagas
 *                 value:
 *                   erro: SEM_VAGAS
 *                   mensagem: A sessão não tem mais vagas disponíveis.
 *       422:
 *         description: Regra de negócio violada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               naoAberta:
 *                 summary: Sessão que não está ABERTA
 *                 value:
 *                   erro: SESSAO_NAO_ABERTA
 *                   mensagem: Só é possível se inscrever em sessões com status ABERTA.
 *               monitor:
 *                 summary: Aluno é o monitor da sessão
 *                 value:
 *                   erro: MONITOR_NA_PROPRIA_SESSAO
 *                   mensagem: O monitor da sessão não pode se inscrever nela.
 */
router.post('/sessoes/:id/inscricoes', criarInscricao);

export default router;