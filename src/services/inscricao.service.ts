import { ErroNegocio } from '../erros';
import * as sessaoRepository from '../repositories/sessao.repository';
import * as alunoRepository from '../repositories/aluno.repository';
import * as inscricaoRepository from '../repositories/inscricao.repository';

// Inscreve um aluno em uma sessão aplicando as regras na ordem definida.
// Para no primeiro problema encontrado.
export async function criarInscricao(sessaoId: number, alunoId: number) {
  // 1. A sessão existe?
  const sessao = await sessaoRepository.buscarSessaoPorId(sessaoId);
  if (!sessao) {
    throw new ErroNegocio(404, 'SESSAO_NAO_ENCONTRADA', 'Sessão não encontrada.');
  }

  // 2. O aluno existe?
  const aluno = await alunoRepository.buscarAlunoPorId(alunoId);
  if (!aluno) {
    throw new ErroNegocio(404, 'ALUNO_NAO_ENCONTRADO', `Aluno ${alunoId} não encontrado.`);
  }

  // 3. A sessão precisa estar ABERTA.
  if (sessao.status !== 'ABERTA') {
    throw new ErroNegocio(422, 'SESSAO_NAO_ABERTA', 'Só é possível se inscrever em sessões com status ABERTA.');
  }

  // 4. O monitor da sessão não pode se inscrever nela.
  if (await inscricaoRepository.alunoEhMonitorDaSessao(sessaoId, alunoId)) {
    throw new ErroNegocio(422, 'MONITOR_NA_PROPRIA_SESSAO', 'O monitor da sessão não pode se inscrever nela.');
  }

  // 5. O aluno já está inscrito (inscrição ATIVA)?
  if (await inscricaoRepository.existeInscricaoAtiva(sessaoId, alunoId)) {
    throw new ErroNegocio(409, 'JA_INSCRITO', 'O aluno já está inscrito nesta sessão.');
  }

  // 6. Grava só se ainda houver vaga (a conta de vagas é feita dentro do próprio INSERT).
  // Limitação conhecida: o INSERT condicional reduz muito, mas não elimina por completo, o risco de
  // duas inscrições simultâneas ficarem com a última vaga. Para eliminar, seria preciso travar a linha da sessão.
  try {
    const inscricao = await inscricaoRepository.inserirInscricaoSeHouverVaga(sessaoId, alunoId);
    if (!inscricao) {
      throw new ErroNegocio(409, 'SEM_VAGAS', 'A sessão não tem mais vagas disponíveis.');
    }
    return inscricao;
  } catch (erro) {
    // 23505 = violação do índice único: duas inscrições do mesmo aluno chegaram ao mesmo tempo.
    if ((erro as { code?: string }).code === '23505') {
      throw new ErroNegocio(409, 'JA_INSCRITO', 'O aluno já está inscrito nesta sessão.');
    }
    throw erro;
  }
}