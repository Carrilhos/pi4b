import { Request, Response, NextFunction } from 'express';
import { ErroNegocio, Detalhe } from '../erros';
import * as monitorService from '../services/monitor.service';
import { FiltrosMonitor } from '../repositories/monitor.repository';

const MAIOR_INTEGER = 2147483647;

// Monta o erro 400 com todos os problemas encontrados, para devolver de uma vez.
function erroDeValidacao(detalhes: Detalhe[]) {
  return new ErroNegocio(400, 'REQUISICAO_INVALIDA', 'Dados inválidos na requisição.', detalhes);
}

// Aceita só dígitos (barra "abc", "-1" e "1.5") e valor entre 1 e o maior INTEGER do Postgres.
function ehIdValido(texto: string) {
  return /^\d+$/.test(texto) && Number(texto) >= 1 && Number(texto) <= MAIOR_INTEGER;
}

// GET /monitores
export async function listarMonitores(req: Request, res: Response, next: NextFunction) {
  try {
    const { disciplina, ativo } = req.query;
    const filtros: FiltrosMonitor = {};
    const detalhes: Detalhe[] = [];

    // Cada filtro é opcional: só validamos (e usamos) os que vieram na URL.
    // Os valores da query string sempre chegam como texto.
    if (disciplina !== undefined) {
      if (typeof disciplina === 'string' && ehIdValido(disciplina)) {
        filtros.disciplina = Number(disciplina);
      } else {
        detalhes.push({ campo: 'disciplina', problema: 'deve ser um inteiro maior que zero' });
      }
    }

    if (ativo !== undefined) {
      if (ativo === 'true' || ativo === 'false') {
        filtros.ativo = ativo === 'true';
      } else {
        detalhes.push({ campo: 'ativo', problema: 'deve ser true ou false' });
      }
    }

    if (detalhes.length > 0) {
      throw erroDeValidacao(detalhes);
    }

    const monitores = await monitorService.listarMonitores(filtros);
    // Sem resultados devolve [] com 200: uma lista vazia não é um erro.
    res.status(200).json(monitores);
  } catch (erro) {
    next(erro);
  }
}

// GET /monitores/:id
export async function buscarMonitor(req: Request, res: Response, next: NextFunction) {
  try {
    const texto = String(req.params.id);
    if (!ehIdValido(texto)) {
      throw erroDeValidacao([{ campo: 'id', problema: 'deve ser um inteiro positivo' }]);
    }

    const monitor = await monitorService.buscarMonitor(Number(texto));
    res.status(200).json(monitor);
  } catch (erro) {
    next(erro);
  }
}