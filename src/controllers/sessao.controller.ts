import { Request, Response, NextFunction } from 'express';
import { ErroNegocio, Detalhe } from '../erros';
import * as sessaoService from '../services/sessao.service';
import { FiltrosSessao } from '../repositories/sessao.repository';

// sem fuso e sem milissegundos
const FORMATO_DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_VALIDOS = ['ABERTA', 'CANCELADA', 'CONCLUIDA'];

function ehInteiroPositivo(valor: unknown) {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}

// regex + new Date pra barrar mês 13, hora 25 etc
function ehDataValida(valor: unknown, formato: RegExp) {
  return typeof valor === 'string' && formato.test(valor) && !isNaN(new Date(valor).getTime());
}

function erroDeValidacao(detalhes: Detalhe[]) {
  return new ErroNegocio(400, 'REQUISICAO_INVALIDA', 'Dados inválidos na requisição.', detalhes);
}

// POST /sessoes
export async function criarSessao(req: Request, res: Response, next: NextFunction) {
  try {
    // sem body o req.body vem undefined
    const corpo = req.body ?? {};
    const { monitorId, disciplinaId, inicio, fim, local, vagas } = corpo;
    const detalhes: Detalhe[] = [];

    // junta todos os erros pra devolver de uma vez
    if (!ehInteiroPositivo(monitorId)) {
      detalhes.push({ campo: 'monitorId', problema: 'obrigatório, deve ser um inteiro maior que zero' });
    }
    if (!ehInteiroPositivo(disciplinaId)) {
      detalhes.push({ campo: 'disciplinaId', problema: 'obrigatório, deve ser um inteiro maior que zero' });
    }

    const inicioValido = ehDataValida(inicio, FORMATO_DATA_HORA);
    const fimValido = ehDataValida(fim, FORMATO_DATA_HORA);
    if (!inicioValido) {
      detalhes.push({ campo: 'inicio', problema: 'obrigatório, no formato YYYY-MM-DDTHH:MM:SS' });
    }
    if (!fimValido) {
      detalhes.push({ campo: 'fim', problema: 'obrigatório, no formato YYYY-MM-DDTHH:MM:SS' });
    }
    // mesmo formato, então dá pra comparar como texto
    if (inicioValido && fimValido && fim <= inicio) {
      detalhes.push({ campo: 'fim', problema: 'deve ser maior que inicio' });
    }

    if (typeof local !== 'string' || local.trim() === '' || local.trim().length > 100) {
      detalhes.push({ campo: 'local', problema: 'obrigatório, texto de 1 a 100 caracteres' });
    }
    if (!ehInteiroPositivo(vagas)) {
      detalhes.push({ campo: 'vagas', problema: 'obrigatório, deve ser um inteiro maior que zero' });
    }

    if (detalhes.length > 0) {
      throw erroDeValidacao(detalhes);
    }

    const sessao = await sessaoService.criarSessao({
      monitorId,
      disciplinaId,
      inicio,
      fim,
      local: local.trim(),
      vagas,
    });

    res.status(201).location(`/sessoes/${sessao.id}`).json(sessao);
  } catch (erro) {
    next(erro);
  }
}

// GET /sessoes
export async function listarSessoes(req: Request, res: Response, next: NextFunction) {
  try {
    const { disciplina, status, data } = req.query;
    const filtros: FiltrosSessao = {};
    const detalhes: Detalhe[] = [];

    // valores da query string sempre chegam como string
    if (disciplina !== undefined) {
      if (typeof disciplina === 'string' && /^\d+$/.test(disciplina) && Number(disciplina) > 0) {
        filtros.disciplina = Number(disciplina);
      } else {
        detalhes.push({ campo: 'disciplina', problema: 'deve ser um inteiro maior que zero' });
      }
    }

    if (status !== undefined) {
      if (typeof status === 'string' && STATUS_VALIDOS.includes(status)) {
        filtros.status = status;
      } else {
        detalhes.push({ campo: 'status', problema: 'deve ser ABERTA, CANCELADA ou CONCLUIDA' });
      }
    }

    if (data !== undefined) {
      if (ehDataValida(data, FORMATO_DATA)) {
        filtros.data = data as string;
      } else {
        detalhes.push({ campo: 'data', problema: 'deve estar no formato YYYY-MM-DD' });
      }
    }

    if (detalhes.length > 0) {
      throw erroDeValidacao(detalhes);
    }

    const sessoes = await sessaoService.listarSessoes(filtros);
    res.status(200).json(sessoes);
  } catch (erro) {
    next(erro);
  }
}
