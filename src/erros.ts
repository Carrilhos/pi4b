import { Request, Response, NextFunction } from 'express';

export type Detalhe = { campo: string; problema: string };

// Erro "esperado": quando a requisição viola alguma regra.
// Guarda o status HTTP e o corpo que será enviado ao cliente.
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

// Middleware de erros do Express (registrado por último no app.ts).
// Transforma qualquer erro na resposta JSON no formato padrão da API.
export function tratarErros(err: any, req: Request, res: Response, next: NextFunction) {
  // Erros que nós mesmos lançamos no controller ou no service.
  if (err instanceof ErroNegocio) {
    res.status(err.status).json({
      erro: err.erro,
      mensagem: err.mensagem,
      detalhes: err.detalhes, // quando é undefined, o JSON não inclui o campo
    });
    return;
  }

  // O express.json() não conseguiu ler o corpo (JSON malformado).
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: 'Dados inválidos na requisição.',
      detalhes: [{ campo: 'corpo', problema: 'não é um JSON válido' }],
    });
    return;
  }

  // 23P01: o banco recusou o INSERT pela restrição sessao_sem_sobreposicao.
  // Acontece se duas requisições ao mesmo tempo passarem pela checagem do service (RN2).
  if (err.code === '23P01') {
    res.status(409).json({
      erro: 'CONFLITO_DE_HORARIO',
      mensagem: 'O monitor já possui uma sessão nesse horário.',
    });
    return;
  }

  // 22008: data inexistente que o new Date() do JavaScript aceita (ex.: 30/02),
  // mas o Postgres recusa. É um erro de quem enviou, então respondemos 400.
  if (err.code === '22008') {
    res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: 'Dados inválidos na requisição.',
      detalhes: [{ campo: 'data', problema: 'data inexistente no calendário' }],
    });
    return;
  }

  // Qualquer outro erro é inesperado: registra no console para investigarmos,
  // mas não mostra os detalhes internos ao cliente.
  console.error(err);
  res.status(500).json({
    erro: 'ERRO_INTERNO',
    mensagem: 'Ocorreu um erro inesperado no servidor.',
  });
}
