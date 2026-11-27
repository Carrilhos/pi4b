import { ErroNegocio } from '../erros';
import * as monitorRepository from '../repositories/monitor.repository';
import { FiltrosMonitor } from '../repositories/monitor.repository';

// Lista os monitores. Não há regra de negócio aqui por enquanto, só repassa os filtros.
export async function listarMonitores(filtros: FiltrosMonitor) {
  return monitorRepository.listarMonitores(filtros);
}

// Busca um monitor pelo id. Se não existir, lança 404.
export async function buscarMonitor(id: number) {
  const monitor = await monitorRepository.buscarMonitorComDisciplinas(id);

  if (!monitor) {
    throw new ErroNegocio(404, 'MONITOR_NAO_ENCONTRADO', `Monitor ${id} não encontrado.`);
  }

  return monitor;
}