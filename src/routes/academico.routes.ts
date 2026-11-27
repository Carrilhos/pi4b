import { Router } from 'express';
import { listarDisciplinas, listarAlunos } from '../controllers/academico.controller';

// Rotas do módulo Acadêmico (disciplinas e alunos).
// A documentação do Swagger fica no comentário @openapi logo acima de cada rota:
// ao alterar uma rota, atualize o comentário dela na mesma alteração.
const router = Router();

/**
 * @openapi
 * /disciplinas:
 *   get:
 *     summary: Lista as disciplinas
 *     description: Devolve todas as disciplinas ordenadas pelo código. Sem disciplinas, devolve uma lista vazia.
 *     tags: [Acadêmico]
 *     responses:
 *       200:
 *         description: Lista de disciplinas (pode ser vazia).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Disciplina' }
 *             example:
 *               - id: 1
 *                 codigo: ADS101
 *                 nome: Banco de Dados
 *               - id: 2
 *                 codigo: ADS102
 *                 nome: Programação Orientada a Objetos
 */
router.get('/disciplinas', listarDisciplinas);

/**
 * @openapi
 * /alunos:
 *   get:
 *     summary: Lista os alunos
 *     description: Devolve todos os alunos ordenados pelo nome. Sem alunos, devolve uma lista vazia.
 *     tags: [Acadêmico]
 *     responses:
 *       200:
 *         description: Lista de alunos (pode ser vazia).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Aluno' }
 *             example:
 *               - id: 1
 *                 nome: Ana Souza
 *                 matricula: '20230001'
 *                 curso: Análise e Desenvolvimento de Sistemas
 *               - id: 2
 *                 nome: Bruno Lima
 *                 matricula: '20230002'
 *                 curso: Análise e Desenvolvimento de Sistemas
 */
router.get('/alunos', listarAlunos);

export default router;