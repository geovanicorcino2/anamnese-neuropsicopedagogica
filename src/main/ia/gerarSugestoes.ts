import type { PlanejamentoIntervencao } from "@core/db/types";
import { montarConteudoFicha } from "@core/services/anamneseContent";
import { interpretarRespostaSugestoes, montarPromptSugestoes } from "@core/services/promptSugestoes";
import { familiaresRepository, fichasRepository, perfilRepository, planejamentosRepository, respostasRepository } from "@main/db";
import { gerarTextoIa } from "@main/ia/clienteIa";

// Nome do arquivo mantido por continuidade (ver promptSugestoes.ts) — gera Objetivo/Materiais de
// UMA sessão já criada (rascunho) em PlanejamentosIntervencao.
export async function gerarSugestoesParaFicha(idPlanejamento: string): Promise<PlanejamentoIntervencao> {
  const planejamento = planejamentosRepository.getPlanejamento(idPlanejamento);
  if (!planejamento) throw new Error(`Planejamento "${idPlanejamento}" não encontrado.`);

  const ficha = fichasRepository.getFicha(planejamento.ID_Ficha);
  if (!ficha) throw new Error(`Ficha "${planejamento.ID_Ficha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  if (!planejamento.Atividades?.trim()) {
    throw new Error("Preencha ao menos as Atividades da sessão antes de gerar o planejamento.");
  }

  const respostas = respostasRepository.listRespostas(ficha.ID_Ficha);
  const familiares = familiaresRepository.listFamiliares(ficha.ID_Ficha);
  const conteudo = montarConteudoFicha({ ficha, perfil, respostas, familiares });

  const prompt = montarPromptSugestoes(conteudo, {
    tempoSessao: planejamento.Tempo_Sessao,
    atividades: planejamento.Atividades,
  });
  const textoIa = await gerarTextoIa(perfil, prompt);
  const { objetivo, materiais } = interpretarRespostaSugestoes(textoIa);

  return planejamentosRepository.updatePlanejamento(idPlanejamento, ficha.ID_Ficha, {
    objetivoGerado: objetivo,
    materiaisGerado: materiais,
    geradoEm: new Date().toISOString(),
  });
}
