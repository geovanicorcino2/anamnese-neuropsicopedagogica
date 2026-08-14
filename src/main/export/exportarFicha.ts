import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import { montarConteudoFicha, type ConteudoFicha } from "@core/services/anamneseContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import type { Ficha } from "@core/db/types";
import { familiaresRepository, fichasRepository, perfilRepository, respostasRepository } from "@main/db";
import { gerarDocxAnamnese } from "@main/export/docxAnamneseBuilder";
import { gerarPdfAnamnese } from "@main/export/pdfAnamnesePrint";

export interface ResultadoExportacao {
  cancelado: boolean;
  caminho?: string;
}

function nomeArquivoSugerido(nomeCrianca: string, extensao: string): string {
  const nomeSeguro = nomeCrianca.replace(/[\\/:*?"<>|]/g, "").trim() || "ficha";
  return `Anamnese - ${nomeSeguro}.${extensao}`;
}

interface DadosExportacaoFicha {
  ficha: Ficha;
  conteudo: ConteudoFicha;
  respostasMap: Map<string, string>;
}

async function montarConteudoDaFicha(idFicha: string): Promise<DadosExportacaoFicha> {
  const ficha = fichasRepository.getFicha(idFicha);
  if (!ficha) throw new Error(`Ficha "${idFicha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const respostas = respostasRepository.listRespostas(idFicha);
  const familiares = familiaresRepository.listFamiliares(idFicha);

  const conteudo = montarConteudoFicha({ ficha, perfil, respostas, familiares });
  const respostasMap = new Map(respostas.map((r) => [r.ID_Campo, r.Valor]));

  return { ficha, conteudo, respostasMap };
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

export async function exportarFichaDocx(idFicha: string): Promise<ResultadoExportacao> {
  const { ficha, conteudo, respostasMap } = await montarConteudoDaFicha(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar ficha de anamnese (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxAnamnese(ficha, conteudo, respostasMap, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarFichaPdf(idFicha: string): Promise<ResultadoExportacao> {
  const { ficha, conteudo, respostasMap } = await montarConteudoDaFicha(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar ficha de anamnese (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfAnamnese(ficha, conteudo, respostasMap, obterIdentidadeVisual());
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
