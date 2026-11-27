import { Request, Response, NextFunction } from 'express';
import * as academicoService from '../services/academico.service';

// GET /disciplinas
export async function listarDisciplinas(req: Request, res: Response, next: NextFunction) {
  try {
    const disciplinas = await academicoService.listarDisciplinas();
    // Sem resultados devolve [] com 200: uma lista vazia não é um erro.
    res.status(200).json(disciplinas);
  } catch (erro) {
    next(erro);
  }
}

// GET /alunos
export async function listarAlunos(req: Request, res: Response, next: NextFunction) {
  try {
    const alunos = await academicoService.listarAlunos();
    res.status(200).json(alunos);
  } catch (erro) {
    next(erro);
  }
}