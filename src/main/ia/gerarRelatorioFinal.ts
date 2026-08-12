import type { RelatorioFinal } from "@core/db/types";
import { montarConteudoFicha } from "@core/services/anamneseContent";
import { montarConteudoIntervencao } from "@core/services/intervencaoContent";
import { montarPromptRelatorioFinal } from "@core/services/promptRelatorioFinal";
import {
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  relatorioFinalRepository,
  respostasRepository,
  sugestoesRepository,
} from "@main/db";
import { gerarTextoIa } from "@main/ia/clienteIa";

export async function gerarRelatorioFinalParaFicha(idFicha: string): Promise<RelatorioFinal> {
  const ficha = fichasRepository.getFicha(idFicha);
  if (!ficha) throw new Error(`Ficha "${idFicha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const sugestao = sugestoesRepository.getSugestao(idFicha);
  if (!sugestao?.Objetivo_Gerado) {
    throw new Error("Gere a Sugestão de Intervenção antes de gerar o relatório final.");
  }

  const entrada = relatorioFinalRepository.getRelatorioFinal(idFicha);
  if (
    !entrada?.Objetivo_Alcancado ||
    !entrada.Avaliacao_Atencao ||
    !entrada.Avaliacao_Motivacao ||
    !entrada.Avaliacao_Interacao
  ) {
    throw new Error("Preencha o objetivo alcançado e as avaliações antes de gerar o relatório final.");
  }

  const respostas = respostasRepository.listRespostas(idFicha);
  const familiares = familiaresRepository.listFamiliares(idFicha);
  const conteudoAnamnese = montarConteudoFicha({ ficha, perfil, respostas, familiares });
  const conteudoIntervencao = montarConteudoIntervencao({ ficha, perfil, sugestao });

  const prompt = montarPromptRelatorioFinal(conteudoAnamnese, conteudoIntervencao, {
    objetivoAlcancado: entrada.Objetivo_Alcancado,
    avaliacaoAtencao: entrada.Avaliacao_Atencao,
    avaliacaoMotivacao: entrada.Avaliacao_Motivacao,
    avaliacaoInteracao: entrada.Avaliacao_Interacao,
    observacoesFinais: entrada.Observacoes_Finais,
  });
  const textoIa = await gerarTextoIa(perfil, prompt);

  return relatorioFinalRepository.salvarResultado(idFicha, { relatorioGerado: textoIa.trim() });
}
