import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import { montarConteudoIntervencao, type ConteudoIntervencao } from "@core/services/intervencaoContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import { fichasRepository, perfilRepository, sugestoesRepository } from "@main/db";
import { gerarDocxIntervencao } from "@main/export/docxIntervencaoBuilder";
import { gerarPdfIntervencao } from "@main/export/pdfIntervencaoTemplate";

export interface ResultadoExportacao {
  cancelado: boolean;
  caminho?: string;
}

function nomeArquivoSugerido(nomeCrianca: string, extensao: string): string {
  const nomeSeguro = nomeCrianca.replace(/[\\/:*?"<>|]/g, "").trim() || "ficha";
  return `Planejamento de Intervenção - ${nomeSeguro}.${extensao}`;
}

function montarConteudoDaIntervencao(idFicha: string): ConteudoIntervencao {
  const ficha = fichasRepository.getFicha(idFicha);
  if (!ficha) throw new Error(`Ficha "${idFicha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const sugestao = sugestoesRepository.getSugestao(idFicha);
  if (!sugestao?.Objetivo_Gerado) throw new Error("Gere a sugestão de intervenção antes de exportar.");

  return montarConteudoIntervencao({ ficha, perfil, sugestao });
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

export async function exportarIntervencaoDocx(idFicha: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDaIntervencao(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar planejamento de intervenção (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxIntervencao(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarIntervencaoPdf(idFicha: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDaIntervencao(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar planejamento de intervenção (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfIntervencao(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
