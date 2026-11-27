import { Request, Response, NextFunction } from 'express';
import { ErroNegocio, Detalhe } from '../erros';
import * as inscricaoService from '../services/inscricao.service';

const MAIOR_INTEGER = 2147483647;

function ehInteiroPositivo(valor: unknown) {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0 && valor <= MAIOR_INTEGER;
}

// POST /sessoes/:id/inscricoes
// Enquanto não existe login, o alunoId vem no corpo (a T24 troca pelo usuário logado).
export async function criarInscricao(req: Request, res: Response, next: NextFunction) {
  try {
    const detalhes: Detalhe[] = [];

    // O id da sessão vem na URL, sempre como texto.
    const texto = String(req.params.id);
    const idValido = /^\d+$/.test(texto) && Number(texto) >= 1 && Number(texto) <= MAIOR_INTEGER;
    if (!idValido) {
      detalhes.push({ campo: 'id', problema: 'deve ser um inteiro positivo' });
    }

    const { alunoId } = req.body ?? {};
    if (!ehInteiroPositivo(alunoId)) {
      detalhes.push({ campo: 'alunoId', problema: 'obrigatório, deve ser um inteiro maior que zero' });
    }

    if (detalhes.length > 0) {
      throw new ErroNegocio(400, 'REQUISICAO_INVALIDA', 'Dados inválidos na requisição.', detalhes);
    }

    const inscricao = await inscricaoService.criarInscricao(Number(texto), alunoId);
    res.status(201).json(inscricao);
  } catch (erro) {
    next(erro);
  }
}