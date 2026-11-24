import { Request, Response, NextFunction } from 'express';
import { ErroNegocio, Detalhe } from '../erros';
import * as sessaoService from '../services/sessao.service';
import { FiltrosSessao } from '../repositories/sessao.repository';

// Formatos aceitos: data e hora sem fuso e sem milissegundos, e só data.
const FORMATO_DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_VALIDOS = ['ABERTA', 'CANCELADA', 'CONCLUIDA'];

function ehInteiroPositivo(valor: unknown) {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}

// Confere o formato com a regex e se o JavaScript consegue entender a data
// (isso barra, por exemplo, mês 13 ou hora 25).
function ehDataValida(valor: unknown, formato: RegExp) {
  return typeof valor === 'string' && formato.test(valor) && !isNaN(new Date(valor).getTime());
}

// Monta o erro 400 com todos os problemas encontrados, para devolver de uma vez.
function erroDeValidacao(detalhes: Detalhe[]) {
  return new ErroNegocio(400, 'REQUISICAO_INVALIDA', 'Dados inválidos na requisição.', detalhes);
}

// POST /sessoes
export async function criarSessao(req: Request, res: Response, next: NextFunction) {
  try {
    // Se o corpo vier vazio, usamos um objeto vazio para que cada campo vire "obrigatório".
    const corpo = req.body ?? {};
    const { monitorId, disciplinaId, inicio, fim, local, vagas } = corpo;
    const detalhes: Detalhe[] = [];

    // Validação de formato: juntamos todos os problemas antes de responder.
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
    // Como as duas datas têm exatamente o mesmo formato, comparar os textos
    // dá o mesmo resultado que comparar as datas.
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

    // Formato ok: as regras de negócio ficam com o service.
    const sessao = await sessaoService.criarSessao({
      monitorId,
      disciplinaId,
      inicio,
      fim,
      local: local.trim(),
      vagas,
    });

    // 201 Created + header Location apontando para o novo recurso.
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

    // Cada filtro é opcional: só validamos (e usamos) os que vieram na URL.
    // Os valores da query string sempre chegam como texto.
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
    // Sem resultados devolve [] com 200: uma lista vazia não é um erro.
    res.status(200).json(sessoes);
  } catch (erro) {
    next(erro);
  }
}

// GET /sessoes/:id
export async function buscarSessao(req: Request, res: Response, next: NextFunction) {
  try {
    const texto = String(req.params.id);

    // Aceita só dígitos (barra "abc", "-1" e "1.5") e valor entre 1 e o maior INTEGER do Postgres
    const valido = /^\d+$/.test(texto) && Number(texto) >= 1 && Number(texto) <= 2147483647;

    if (!valido) {
      throw new ErroNegocio(400, 'REQUISICAO_INVALIDA', 'Dados inválidos na requisição.', [
        { campo: 'id', problema: 'deve ser um inteiro positivo' },
      ]);
    }

    const sessao = await sessaoService.buscarSessao(Number(texto));
    res.status(200).json(sessao);
  } catch (erro) {
    next(erro);
  }
}
