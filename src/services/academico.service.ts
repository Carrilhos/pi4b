import * as disciplinaRepository from '../repositories/disciplina.repository';
import * as alunoRepository from '../repositories/aluno.repository';

// Listagens do módulo Acadêmico. Não há regra de negócio aqui por enquanto,
// o service só repassa a consulta (mantém as três camadas, como nos outros recursos).
export async function listarDisciplinas() {
  return disciplinaRepository.listarDisciplinas();
}

export async function listarAlunos() {
  return alunoRepository.listarAlunos();
}