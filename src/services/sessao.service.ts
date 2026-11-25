import { ErroNegocio } from '../erros';
import * as monitorRepository from '../repositories/monitor.repository';
import * as disciplinaRepository from '../repositories/disciplina.repository';
import * as sessaoRepository from '../repositories/sessao.repository';
import { NovaSessao, FiltrosSessao } from '../repositories/sessao.repository';

// Regras que valem tanto para criar quanto para alterar uma sessão.
// Para no primeiro problema encontrado.
// No PUT, "sessaoIgnorada" é a própria sessão: ela não pode conflitar de horário consigo mesma.
async function verificarRegras(dados: NovaSessao, sessaoIgnorada: number | null) {
  // 1. O monitor existe?
  const monitor = await monitorRepository.buscarMonitorPorId(dados.monitorId);
  if (!monitor) {
    throw new ErroNegocio(404, 'MONITOR_NAO_ENCONTRADO', `Monitor ${dados.monitorId} não encontrado.`);
  }

  // 2. A disciplina existe?
  const disciplina = await disciplinaRepository.buscarDisciplinaPorId(dados.disciplinaId);
  if (!disciplina) {
    throw new ErroNegocio(404, 'DISCIPLINA_NAO_ENCONTRADA', `Disciplina ${dados.disciplinaId} não encontrada.`);
  }

  // 3. RN-A: só monitor ativo pode criar sessão.
  if (!monitor.ativo) {
    throw new ErroNegocio(422, 'MONITOR_INATIVO', 'O monitor está inativo e não pode criar sessões.');
  }

  // 4. RN1: o monitor precisa atender a disciplina.
  const atende = await monitorRepository.monitorAtendeDisciplina(dados.monitorId, dados.disciplinaId);
  if (!atende) {
    throw new ErroNegocio(422, 'MONITOR_NAO_ATENDE_DISCIPLINA', 'O monitor não atende esta disciplina.');
  }

  // 5. RN2: o monitor não pode ter duas sessões no mesmo horário.
  // (O banco também barra isso; aqui é para devolver uma mensagem mais clara.)
  const conflito = await sessaoRepository.buscarConflito(dados.monitorId, dados.inicio, dados.fim, sessaoIgnorada);
  if (conflito) {
    throw new ErroNegocio(
      409,
      'CONFLITO_DE_HORARIO',
      `O monitor já possui uma sessão entre ${conflito.inicio} e ${conflito.fim} nesta data.`
    );
  }
}

// Cria uma sessão aplicando as regras de negócio na ordem definida.
export async function criarSessao(dados: NovaSessao) {
  await verificarRegras(dados, null);

  // Tudo certo: grava e devolve a sessão completa (com nomes do monitor e da disciplina).
  const id = await sessaoRepository.inserirSessao(dados);
  return sessaoRepository.buscarSessaoPorId(id);
}

// Lista as sessões. Não há regra de negócio aqui por enquanto, só repassa os filtros.
export async function listarSessoes(filtros: FiltrosSessao) {
  return sessaoRepository.listarSessoes(filtros);
}

// Busca uma sessão pelo id. Se não existir, lança 404.
export async function buscarSessao(id: number) {
  const sessao = await sessaoRepository.buscarSessaoPorId(id);

  if (!sessao) {
    throw new ErroNegocio(404, 'SESSAO_NAO_ENCONTRADA', 'Sessão não encontrada.');
  }

  return sessao;
}

// Altera horário, local e vagas de uma sessão (PUT).
export async function atualizarSessao(id: number, dados: NovaSessao) {
  // 1. A sessão existe?
  const sessao = await sessaoRepository.buscarSessaoPorId(id);
  if (!sessao) {
    throw new ErroNegocio(404, 'SESSAO_NAO_ENCONTRADA', 'Sessão não encontrada.');
  }

  // 2. Só sessões ABERTAS podem ser alteradas.
  if (sessao.status !== 'ABERTA') {
    throw new ErroNegocio(422, 'SESSAO_NAO_ABERTA', 'Só é possível alterar sessões com status ABERTA.');
  }

  // 3. Repete monitor, disciplina, RN-A, RN1 e RN2 (a consulta de conflito ignora esta sessão).
  await verificarRegras(dados, id);

  // 4. As vagas novas não podem ser menores que o número de inscrições ativas.
  const inscritos = sessaoRepository.contarInscricoesAtivas(id) as unknown as number;
  if (dados.vagas < inscritos) {
    throw new ErroNegocio(
      422,
      'VAGAS_MENOR_QUE_INSCRITOS',
      `A sessão já tem ${inscritos} inscrições ativas; as vagas não podem ser menos que isso.`
    );
  }

  // 5. Tudo certo: atualiza e devolve a sessão completa.
  await sessaoRepository.atualizarSessao(id, dados);
  return sessaoRepository.buscarSessaoPorId(id);
}