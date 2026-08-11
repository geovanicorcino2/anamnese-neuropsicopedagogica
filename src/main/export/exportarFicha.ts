import { dialog } from "electron";
import { writeFileSync } from "node:fs";
import { montarConteudoFicha, type ConteudoFicha } from "@core/services/anamneseContent";
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

async function montarConteudoDaFicha(idFicha: string): Promise<ConteudoFicha> {
  const ficha = fichasRepository.getFicha(idFicha);
  if (!ficha) throw new Error(`Ficha "${idFicha}" não encontrada.`);

  const perfil = perfilRepository.getPerfil();
  if (!perfil) throw new Error("Perfil profissional ainda não foi configurado.");

  const respostas = respostasRepository.listRespostas(idFicha);
  const familiares = familiaresRepository.listFamiliares(idFicha);

  return montarConteudoFicha({ ficha, perfil, respostas, familiares });
}

export async function exportarFichaDocx(idFicha: string): Promise<ResultadoExportacao> {
  const conteudo = await montarConteudoDaFicha(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar ficha de anamnese (Word)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "docx"),
    filters: [{ name: "Documento Word", extensions: ["docx"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarDocxAnamnese(conteudo);
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}

export async function exportarFichaPdf(idFicha: string): Promise<ResultadoExportacao> {
  const conteudo = await montarConteudoDaFicha(idFicha);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Salvar ficha de anamnese (PDF)",
    defaultPath: nomeArquivoSugerido(conteudo.nomeCrianca, "pdf"),
    filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { cancelado: true };

  const bytes = await gerarPdfAnamnese(conteudo);
  writeFileSync(filePath, bytes);
  return { cancelado: false, caminho: filePath };
}
