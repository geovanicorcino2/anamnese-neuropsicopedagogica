import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import {
  montarConteudoRelatorioAvaliativo,
  type ConteudoRelatorioAvaliativo,
} from "@core/services/relatorioAvaliativoContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import {
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  relatoriosAvaliativosRepository,
  respostasRepository,
} from "@main/db";
import { gerarDocxRelatorioAvaliativo } from "@main/export/docxRelatorioAvaliativoBuilder";
import { gerarPdfRelatorioAvaliativo } from "@main/export/pdfRelatorioAvaliativoTemplate";

export interface ResultadoExportacao {
  cancelado: boolean;
  caminho?: string;
}

function nomeArquivoSugerido(nomeCrianca: string, extensao: string): string {
  const nomeSeguro = nomeCrianca.replace(/[\\/:*?"<>|]/g, "").trim() || "paciente";
  return `Relatório Avaliativo - ${nomeSeguro}.${extensao}`;
}

function montarConteudoDoRelatorio(idRelatorio: string): ConteudoRelatorioAvaliativo {
  const relatorio = relatoriosAvaliativosRepository.getRelatorioAvaliativo(idRelatorio);
  if (!relatorio) throw new Error(`Relatório Avaliativo "${idRelatorio}" não encontrado.`);

  const ficha = fichasRepository.getFicha(relatorio.ID_Ficha);
  if (!ficha) throw new Error(`Ficha "${relatorio.ID_Ficha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const respostas = respostasRepository.listRespostas(ficha.ID_Ficha);
  const familiares = familiaresRepository.listFamiliares(ficha.ID_Ficha);

  return montarConteudoRelatorioAvaliativo({ ficha, perfil, familiares, respostas, relatorio });
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

export async function exportarRelatorioAvaliativoDocx(idRelatorio: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoRelatorio(idRelatorio);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar relatório avaliativo (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxRelatorioAvaliativo(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarRelatorioAvaliativoPdf(idRelatorio: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoRelatorio(idRelatorio);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar relatório avaliativo (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfRelatorioAvaliativo(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
