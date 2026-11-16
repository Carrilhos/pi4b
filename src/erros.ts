import { Request, Response, NextFunction } from 'express';

export type Detalhe = { campo: string; problema: string };

// erro com status http, lançado no controller e no service
export class ErroNegocio extends Error {
  status: number;
  erro: string;
  mensagem: string;
  detalhes?: Detalhe[];

  constructor(status: number, erro: string, mensagem: string, detalhes?: Detalhe[]) {
    super(mensagem);
    this.status = status;
    this.erro = erro;
    this.mensagem = mensagem;
    this.detalhes = detalhes;
  }
}

// middleware de erros do express
export function tratarErros(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ErroNegocio) {
    res.status(err.status).json({
      erro: err.erro,
      mensagem: err.mensagem,
      detalhes: err.detalhes, // se for undefined não vai pro json
    });
    return;
  }

  // body com json mal formatado
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: 'Dados inválidos na requisição.',
      detalhes: [{ campo: 'corpo', problema: 'não é um JSON válido' }],
    });
    return;
  }

  // 23P01 = constraint sessao_sem_sobreposicao, caso duas requisições cheguem ao mesmo tempo
  if (err.code === '23P01') {
    res.status(409).json({
      erro: 'CONFLITO_DE_HORARIO',
      mensagem: 'O monitor já possui uma sessão nesse horário.',
    });
    return;
  }

  // 22008 = data tipo 30/02, que o new Date() aceita mas o postgres não
  if (err.code === '22008') {
    res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: 'Dados inválidos na requisição.',
      detalhes: [{ campo: 'data', problema: 'data inexistente no calendário' }],
    });
    return;
  }

  // qualquer outro erro: loga e não mostra detalhe pro cliente
  console.error(err);
  res.status(500).json({
    erro: 'ERRO_INTERNO',
    mensagem: 'Ocorreu um erro inesperado no servidor.',
  });
}
