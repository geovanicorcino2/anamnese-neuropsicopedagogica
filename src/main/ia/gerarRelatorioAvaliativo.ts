import type { RelatorioAvaliativo } from "@core/db/types";
import { montarConteudoFicha } from "@core/services/anamneseContent";
import {
  interpretarRespostaRelatorioAvaliativo,
  montarPromptRelatorioAvaliativo,
} from "@core/services/promptRelatorioAvaliativo";
import { formatarDataBR } from "@core/services/formatarData";
import {
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  planejamentosRepository,
  relatoriosAvaliativosRepository,
  respostasRepository,
} from "@main/db";
import { gerarTextoIa } from "@main/ia/clienteIa";

// Resume as sessões de Planejamento de Intervenção já realizadas (data + avaliação pós-sessão),
// pra dar à IA uma visão da evolução ao longo do acompanhamento — sem mandar o texto integral de
// cada sessão (estouraria o prompt rápido se o histórico for longo).
function resumirSessoes(idFicha: string): string | null {
  const sessoes = planejamentosRepository.listPlanejamentos(idFicha);
  if (sessoes.length === 0) return null;

  return sessoes
    .map((s) => {
      const partes = [formatarDataBR(s.Data_Sessao)];
      if (s.Avaliacao_Atencao) partes.push(`atenção ${s.Avaliacao_Atencao}`);
      if (s.Avaliacao_Motivacao) partes.push(`motivação ${s.Avaliacao_Motivacao}`);
      if (s.Avaliacao_Interacao) partes.push(`interação ${s.Avaliacao_Interacao}`);
      if (s.Objetivo_Sessao) partes.push(s.Objetivo_Sessao);
      return `- ${partes.join(", ")}`;
    })
    .join("\n");
}

export async function gerarRelatorioAvaliativoParaFicha(idRelatorio: string): Promise<RelatorioAvaliativo> {
  const relatorio = relatoriosAvaliativosRepository.getRelatorioAvaliativo(idRelatorio);
  if (!relatorio) throw new Error(`Relatório Avaliativo "${idRelatorio}" não encontrado.`);

  const ficha = fichasRepository.getFicha(relatorio.ID_Ficha);
  if (!ficha) throw new Error(`Ficha "${relatorio.ID_Ficha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const respostas = respostasRepository.listRespostas(ficha.ID_Ficha);
  const familiares = familiaresRepository.listFamiliares(ficha.ID_Ficha);
  const conteudo = montarConteudoFicha({ ficha, perfil, respostas, familiares });

  const anteriores = relatoriosAvaliativosRepository
    .listRelatoriosAvaliativos(ficha.ID_Ficha)
    .filter((r) => r.ID_Relatorio !== idRelatorio);
  const relatorioAnteriorTexto = anteriores.length > 0 ? anteriores[0].Recomendacoes : null;

  const resumoSessoes = resumirSessoes(ficha.ID_Ficha);
  const prompt = montarPromptRelatorioAvaliativo(conteudo, resumoSessoes, relatorioAnteriorTexto);
  const textoIa = await gerarTextoIa(perfil, prompt);
  const resposta = interpretarRespostaRelatorioAvaliativo(textoIa);

  return relatoriosAvaliativosRepository.updateRelatorioAvaliativo(idRelatorio, ficha.ID_Ficha, {
    objetivoAvaliacao: resposta.objetivoAvaliacao,
    historicoEscolarFamiliar: resposta.historicoEscolarFamiliar,
    aspectosEmocionaisComportamentais: resposta.aspectosEmocionaisComportamentais,
    metodologiaAvaliacao: resposta.metodologiaAvaliacao,
    aspectosCognitivosAprendizagem: resposta.aspectosCognitivosAprendizagem,
    instrumentosUtilizados: resposta.instrumentosUtilizados,
    resultadosAvaliacao: resposta.resultadosAvaliacao,
    intervencoesAplicadas: resposta.intervencoesAplicadas,
    recomendacoes: resposta.recomendacoes,
    geradoEm: new Date().toISOString(),
  });
}
