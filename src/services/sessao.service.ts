import { ErroNegocio } from '../erros';
import * as monitorRepository from '../repositories/monitor.repository';
import * as disciplinaRepository from '../repositories/disciplina.repository';
import * as sessaoRepository from '../repositories/sessao.repository';
import { NovaSessao, FiltrosSessao } from '../repositories/sessao.repository';

// verifica na ordem e para no primeiro erro
export async function criarSessao(dados: NovaSessao) {
  // 1. monitor existe?
  const monitor = await monitorRepository.buscarMonitorPorId(dados.monitorId);
  if (!monitor) {
    throw new ErroNegocio(404, 'MONITOR_NAO_ENCONTRADO', `Monitor ${dados.monitorId} não encontrado.`);
  }

  // 2. disciplina existe?
  const disciplina = await disciplinaRepository.buscarDisciplinaPorId(dados.disciplinaId);
  if (!disciplina) {
    throw new ErroNegocio(404, 'DISCIPLINA_NAO_ENCONTRADA', `Disciplina ${dados.disciplinaId} não encontrada.`);
  }

  // 3. monitor precisa estar ativo
  if (!monitor.ativo) {
    throw new ErroNegocio(422, 'MONITOR_INATIVO', 'O monitor está inativo e não pode criar sessões.');
  }

  // 4. monitor precisa atender a disciplina
  const atende = await monitorRepository.monitorAtendeDisciplina(dados.monitorId, dados.disciplinaId);
  if (!atende) {
    throw new ErroNegocio(422, 'MONITOR_NAO_ATENDE_DISCIPLINA', 'O monitor não atende esta disciplina.');
  }

  // 5. conflito de horário (o banco também barra, aqui é pra mensagem ficar melhor)
  const conflito = await sessaoRepository.buscarConflito(dados.monitorId, dados.inicio, dados.fim);
  if (conflito) {
    throw new ErroNegocio(
      409,
      'CONFLITO_DE_HORARIO',
      `O monitor já possui uma sessão entre ${conflito.inicio} e ${conflito.fim} nesta data.`
    );
  }

  // 6. salva e busca de novo pra voltar com os nomes
  const id = await sessaoRepository.inserirSessao(dados);
  return sessaoRepository.buscarSessaoPorId(id);
}

export async function listarSessoes(filtros: FiltrosSessao) {
  return sessaoRepository.listarSessoes(filtros);
}
