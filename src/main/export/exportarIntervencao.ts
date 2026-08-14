import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import { montarConteudoPlanejamento, type ConteudoPlanejamento } from "@core/services/intervencaoContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import { fichasRepository, perfilRepository, planejamentosRepository } from "@main/db";
import { gerarDocxIntervencao } from "@main/export/docxIntervencaoBuilder";
import { gerarPdfIntervencao } from "@main/export/pdfIntervencaoTemplate";

export interface ResultadoExportacao {
  cancelado: boolean;
  caminho?: string;
}

// dataSessao chega já formatada "DD/MM/AAAA" (formatarDataBR) — a barra quebra o diálogo de
// salvar do Windows (interpretada como separador de pasta, truncando o nome sugerido pra só
// "AAAA.ext"). Sanitizar os dois pedaços com o mesmo regex de caracteres proibidos.
function nomeArquivoSugerido(nomeCrianca: string, dataSessao: string, extensao: string): string {
  const nomeSeguro = nomeCrianca.replace(/[\\/:*?"<>|]/g, "").trim() || "paciente";
  const dataSegura = dataSessao.replace(/[\\/:*?"<>|]/g, "-");
  return `Planejamento de Intervenção - ${nomeSeguro} - ${dataSegura}.${extensao}`;
}

function montarConteudoDoPlanejamento(idPlanejamento: string): ConteudoPlanejamento {
  const planejamento = planejamentosRepository.getPlanejamento(idPlanejamento);
  if (!planejamento) throw new Error(`Planejamento "${idPlanejamento}" não encontrado.`);

  const ficha = fichasRepository.getFicha(planejamento.ID_Ficha);
  if (!ficha) throw new Error(`Ficha "${planejamento.ID_Ficha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  return montarConteudoPlanejamento({ ficha, perfil, planejamento });
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

export async function exportarIntervencaoDocx(idPlanejamento: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoPlanejamento(idPlanejamento);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar planejamento de intervenção (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, conteudo.dataSessao, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxIntervencao(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarIntervencaoPdf(idPlanejamento: string): Promise<ResultadoExportacao> {
  const conteudo = montarConteudoDoPlanejamento(idPlanejamento);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar planejamento de intervenção (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, conteudo.dataSessao, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfIntervencao(conteudo, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
