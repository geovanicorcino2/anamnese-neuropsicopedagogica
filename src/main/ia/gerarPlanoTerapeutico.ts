import type { PlanoTerapeutico } from "@core/db/types";
import { montarConteudoFicha } from "@core/services/anamneseContent";
import { interpretarRespostaPlanoTerapeutico, montarPromptPlanoTerapeutico } from "@core/services/promptPlanoTerapeutico";
import { familiaresRepository, fichasRepository, perfilRepository, planosTerapeuticosRepository, respostasRepository } from "@main/db";
import { gerarTextoIa } from "@main/ia/clienteIa";

// Resumo curto do plano anterior (se houver) só com as seções já preenchidas, pra dar continuidade
// à reavaliação semestral sem estourar o prompt com o documento inteiro de novo.
function resumirPlanoAnterior(plano: PlanoTerapeutico): string {
  const secoes: Array<[string, string | null]> = [
    ["Diagnóstico", plano.Diagnostico],
    ["Necessidades", plano.Necessidades],
    ["Metas e prazos", plano.Metas_Prazos],
  ];
  return secoes
    .filter(([, valor]) => valor?.trim())
    .map(([rotulo, valor]) => `${rotulo}: ${valor}`)
    .join("\n");
}

export async function gerarPlanoTerapeuticoParaFicha(idPlano: string): Promise<PlanoTerapeutico> {
  const plano = planosTerapeuticosRepository.getPlanoTerapeutico(idPlano);
  if (!plano) throw new Error(`Plano Terapêutico "${idPlano}" não encontrado.`);

  const ficha = fichasRepository.getFicha(plano.ID_Ficha);
  if (!ficha) throw new Error(`Ficha "${plano.ID_Ficha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const respostas = respostasRepository.listRespostas(ficha.ID_Ficha);
  const familiares = familiaresRepository.listFamiliares(ficha.ID_Ficha);
  const conteudo = montarConteudoFicha({ ficha, perfil, respostas, familiares });

  const anteriores = planosTerapeuticosRepository
    .listPlanosTerapeuticos(ficha.ID_Ficha)
    .filter((p) => p.ID_Plano !== idPlano);
  const planoAnteriorTexto = anteriores.length > 0 ? resumirPlanoAnterior(anteriores[0]) : null;

  const prompt = montarPromptPlanoTerapeutico(conteudo, planoAnteriorTexto || null);
  const textoIa = await gerarTextoIa(perfil, prompt);
  const resposta = interpretarRespostaPlanoTerapeutico(textoIa);

  return planosTerapeuticosRepository.updatePlanoTerapeutico(idPlano, ficha.ID_Ficha, {
    diagnostico: resposta.diagnostico,
    anamneseResumo: resposta.anamneseResumo,
    protocolosAvaliacao: resposta.protocolosAvaliacao,
    capacidadesInteresses: resposta.capacidadesInteresses,
    necessidades: resposta.necessidades,
    metasPrazos: resposta.metasPrazos,
    recursosEstrategias: resposta.recursosEstrategias,
    treinamentoParental: resposta.treinamentoParental,
    profissionaisAcompanham: resposta.profissionaisAcompanham,
    frequenciaAtendimentos: resposta.frequenciaAtendimentos,
    geradoEm: new Date().toISOString(),
  });
}
