import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import { montarConteudoPlanoTerapeutico, type ConteudoPlanoTerapeutico } from "@core/services/planoTerapeuticoContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import { familiaresRepository, fichasRepository, perfilRepository, planosTerapeuticosRepository } from "@main/db";
import { gerarDocxPlanoTerapeutico } from "@main/export/docxPlanoTerapeuticoBuilder";
import { gerarPdfPlanoTerapeutico } from "@main/export/pdfPlanoTerapeuticoTemplate";

export interface ResultadoExportacao {
  cancelado: boolean;
  caminho?: string;
}

// dataPlanejamento chega já formatada "DD/MM/AAAA" — mesmo problema/fix de
// exportarIntervencao.ts (a barra quebra o diálogo de salvar do Windows).
function nomeArquivoSugerido(nomeCrianca: string, dataPlanejamento: string, extensao: string): string {
  const nomeSeguro = nomeCrianca.replace(/[\\/:*?"<>|]/g, "").trim() || "paciente";
  const dataSegura = dataPlanejamento.replace(/[\\/:*?"<>|]/g, "-");
  return `Plano Terapêutico - ${nomeSeguro} - ${dataSegura}.${extensao}`;
}

function montarConteudoDoPlano(idPlano: string): ConteudoPlanoTerapeutico {
  const plano = planosTerapeuticosRepository.getPlanoTerapeutico(idPlano);
  if (!plano) throw new Error(`Plano Terapêutico "${idPlano}" não encontrado.`);

  const ficha = fichasRepository.getFicha(plano.ID_Ficha);
  if (!ficha) throw new Error(`Ficha "${plano.ID_Ficha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const familiares = familiaresRepository.listFamiliares(ficha.ID_Ficha);

  return montarConteudoPlanoTerapeutico({ ficha, perfil, familiares, plano });
}

function obterIdentidadeVisual(): IdentidadeVisualConfig {
  const perfil = perfilRepository.getPerfil();
  return {
    logoBase64: perfil?.Logo_Base64 ?? null,
    logoMime: perfil?.Logo_Mime ?? null,
    bordaBase64: perfil?.Borda_Base64 ?? null,
    bordaMime: perfil?.Borda_Mime ?? null,
  };
}

export async function exportarPlanoTerapeuticoDocx(idPlano: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoPlano(idPlano);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar plano terapêutico (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, conteudo.dataPlanejamento, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxPlanoTerapeutico(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarPlanoTerapeuticoPdf(idPlano: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoPlano(idPlano);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar plano terapêutico (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, conteudo.dataPlanejamento, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfPlanoTerapeutico(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
