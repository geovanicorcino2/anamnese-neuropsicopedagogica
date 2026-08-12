import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import { montarConteudoRelatorioFinal, type ConteudoRelatorioFinal } from "@core/services/relatorioFinalContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import { fichasRepository, perfilRepository, relatorioFinalRepository } from "@main/db";
import { gerarDocxRelatorioFinal } from "@main/export/docxRelatorioFinalBuilder";
import { gerarPdfRelatorioFinal } from "@main/export/pdfRelatorioFinalTemplate";

export interface ResultadoExportacao {
  cancelado: boolean;
  caminho?: string;
}

function nomeArquivoSugerido(nomeCrianca: string, extensao: string): string {
  const nomeSeguro = nomeCrianca.replace(/[\\/:*?"<>|]/g, "").trim() || "ficha";
  return `Relatório Final - ${nomeSeguro}.${extensao}`;
}

function montarConteudoDoRelatorio(idFicha: string): ConteudoRelatorioFinal {
  const ficha = fichasRepository.getFicha(idFicha);
  if (!ficha) throw new Error(`Ficha "${idFicha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const relatorio = relatorioFinalRepository.getRelatorioFinal(idFicha);
  if (!relatorio?.Relatorio_Gerado) throw new Error("Gere o relatório final antes de exportar.");

  return montarConteudoRelatorioFinal({ ficha, perfil, relatorio });
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

export async function exportarRelatorioFinalDocx(idFicha: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoRelatorio(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar relatório final (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxRelatorioFinal(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarRelatorioFinalPdf(idFicha: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoRelatorio(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar relatório final (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfRelatorioFinal(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
