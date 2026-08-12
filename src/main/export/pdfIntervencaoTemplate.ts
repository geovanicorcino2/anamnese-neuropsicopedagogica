import { BrowserWindow, app } from "electron";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ConteudoIntervencao } from "@core/services/intervencaoContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import {
  BORDA_ROXA,
  BORDA_VERDE,
  emuParaPolegadas,
  type FormaDecorativa,
} from "@main/assets/identidadeVisual";
import { lerDimensoesImagem } from "@main/export/dimensoesImagem";

// ABNT: margens esquerda/superior 3cm, direita/inferior 2cm (1cm = 360000 EMU).
const MARGEM_ESQUERDA_EMU = 1080000;
const MARGEM_DIREITA_EMU = 720000;
const PAGINA_LARGURA_EMU = 7560310;

const DISTANCIA_CABECALHO_EMU = 270510;
const ALTURA_LOGO_EMU = 900000;

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function comQuebrasDeLinha(texto: string): string {
  return escaparHtml(texto).split("\n").join("<br/>");
}

function svgFormaDecorativa(forma: FormaDecorativa, instancia: "cabecalho" | "rodape"): string {
  const pos = instancia === "cabecalho" ? forma.cabecalho : forma.rodape;
  const rotacionar = pos.flipH && pos.flipV;
  const estilo = [
    `left:${emuParaPolegadas(pos.xEmu)}in`,
    `top:${emuParaPolegadas(pos.yEmu)}in`,
    `width:${emuParaPolegadas(pos.larguraEmu)}in`,
    `height:${emuParaPolegadas(pos.alturaEmu)}in`,
    rotacionar ? "transform:rotate(180deg)" : "",
    rotacionar ? "transform-origin:center" : "",
  ]
    .filter(Boolean)
    .join(";");

  return `<svg class="forma-decorativa" style="${estilo}" viewBox="0 0 ${forma.viewBoxLargura} ${forma.viewBoxAltura}" xmlns="http://www.w3.org/2000/svg"><path d="${forma.path}" fill="${forma.corHex}" fill-opacity="${forma.alpha}"/></svg>`;
}

function imgCanto(
  base64: string,
  mime: string,
  pos: { xEmu: number; yEmu: number; larguraEmu: number; alturaEmu: number },
  alt: string,
): string {
  const estilo = [
    `left:${emuParaPolegadas(pos.xEmu)}in`,
    `top:${emuParaPolegadas(pos.yEmu)}in`,
    `width:${emuParaPolegadas(pos.larguraEmu)}in`,
    `height:${emuParaPolegadas(pos.alturaEmu)}in`,
    "object-fit:cover",
  ].join(";");
  return `<img class="forma-decorativa" style="${estilo}" src="data:${mime};base64,${base64}" alt="${escaparHtml(alt)}"/>`;
}

function htmlBorda(identidade: IdentidadeVisualConfig): string {
  if (identidade.bordaBase64 && identidade.bordaMime) {
    return [
      imgCanto(identidade.bordaBase64, identidade.bordaMime, BORDA_VERDE.cabecalho, "Borda"),
      imgCanto(identidade.bordaBase64, identidade.bordaMime, BORDA_ROXA.cabecalho, "Borda"),
      imgCanto(identidade.bordaBase64, identidade.bordaMime, BORDA_VERDE.rodape, "Borda"),
      imgCanto(identidade.bordaBase64, identidade.bordaMime, BORDA_ROXA.rodape, "Borda"),
    ].join("\n");
  }

  return [
    svgFormaDecorativa(BORDA_VERDE, "cabecalho"),
    svgFormaDecorativa(BORDA_ROXA, "cabecalho"),
    svgFormaDecorativa(BORDA_VERDE, "rodape"),
    svgFormaDecorativa(BORDA_ROXA, "rodape"),
  ].join("\n");
}

function htmlLogo(identidade: IdentidadeVisualConfig): string {
  if (!identidade.logoBase64 || !identidade.logoMime) return "";

  const dimensoes = lerDimensoesImagem(identidade.logoBase64, identidade.logoMime);
  const larguraLogoEmu = Math.round(ALTURA_LOGO_EMU * (dimensoes.larguraPx / dimensoes.alturaPx));
  const larguraConteudoEmu = PAGINA_LARGURA_EMU - MARGEM_ESQUERDA_EMU - MARGEM_DIREITA_EMU;
  const leftEmu = MARGEM_ESQUERDA_EMU + Math.max(0, Math.round((larguraConteudoEmu - larguraLogoEmu) / 2));
  const topEmu = DISTANCIA_CABECALHO_EMU + 40000;

  const estilo = [
    `left:${emuParaPolegadas(leftEmu)}in`,
    `top:${emuParaPolegadas(topEmu)}in`,
    `width:${emuParaPolegadas(larguraLogoEmu)}in`,
    `height:${emuParaPolegadas(ALTURA_LOGO_EMU)}in`,
  ].join(";");
  return `<img class="logo" style="${estilo}" src="data:${identidade.logoMime};base64,${identidade.logoBase64}" alt="Logo do relatório"/>`;
}

function itemHtml(rotulo: string, valor: string): string {
  return `<p class="item"><b>${escaparHtml(rotulo)}:</b> ${comQuebrasDeLinha(valor)}</p>`;
}

export function montarHtmlIntervencao(conteudo: ConteudoIntervencao, identidade: IdentidadeVisualConfig): string {
  const dataAtendimento = new Date(conteudo.geradoEm).toLocaleDateString("pt-BR");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
  .forma-decorativa, .logo { position: fixed; z-index: 0; }
  .conteudo { position: relative; z-index: 1; padding: 3cm 2cm 2cm 3cm; text-align: justify; }
  h1.titulo { text-align: center; font-size: 16pt; margin: 0 0 18pt; }
  h3.secao { font-size: 12pt; margin: 18pt 0 4pt; }
  p.item { margin: 2pt 0; }
  .assinatura { text-align: center; margin-top: 36pt; }
</style>
</head>
<body>
${htmlBorda(identidade)}
${htmlLogo(identidade)}
<div class="conteudo">
  <h1 class="titulo">PLANEJAMENTO DE INTERVENÇÃO</h1>
  ${itemHtml("Criança", conteudo.nomeCrianca)}
  ${itemHtml("Data de nascimento", conteudo.dataNascimento)}
  ${itemHtml("Escola", conteudo.escola)}
  ${itemHtml("Data do atendimento", dataAtendimento)}
  ${itemHtml("Profissional", `${conteudo.nomeProfissional} — ${conteudo.tituloProfissional}`)}

  <h3 class="secao">Tempo de sessão</h3>
  <p>${comQuebrasDeLinha(conteudo.tempoSessao)}</p>

  <h3 class="secao">Atividades</h3>
  <p>${comQuebrasDeLinha(conteudo.atividades)}</p>

  <h3 class="secao">Objetivo da intervenção</h3>
  <p>${comQuebrasDeLinha(conteudo.objetivo)}</p>

  <h3 class="secao">Materiais</h3>
  <p>${comQuebrasDeLinha(conteudo.materiais)}</p>

  <p class="assinatura">___________________________________<br/>Assinatura ${escaparHtml(conteudo.tituloProfissional)}</p>
</div>
</body>
</html>`;
}

// Sem numeração de página aqui de propósito — o printToPDF do Chromium não suporta caixas de
// margem paginada de forma confiável. No DOCX (docxIntervencaoBuilder.ts) a numeração usa o
// campo PAGE nativo do Word.
export async function gerarPdfIntervencao(
  conteudo: ConteudoIntervencao,
  identidade: IdentidadeVisualConfig,
): Promise<Uint8Array> {
  const html = montarHtmlIntervencao(conteudo, identidade);
  const pastaTemp = mkdtempSync(path.join(app.getPath("temp"), "intervencao-pdf-"));
  const caminhoHtml = path.join(pastaTemp, `${randomUUID()}.html`);
  writeFileSync(caminhoHtml, html, "utf8");

  const janela = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true },
  });

  try {
    await janela.loadFile(caminhoHtml);
    const buffer = await janela.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: { marginType: "custom", top: 0, bottom: 0, left: 0, right: 0 },
    });
    return new Uint8Array(buffer);
  } finally {
    janela.destroy();
    rmSync(pastaTemp, { recursive: true, force: true });
  }
}
