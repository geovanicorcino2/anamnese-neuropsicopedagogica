import { BrowserWindow, app } from "electron";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ConteudoRelatorioAvaliativo } from "@core/services/relatorioAvaliativoContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import { formatarTextoIa } from "@core/services/textoIaFormatado";
import {
  BORDA_ROXA,
  BORDA_VERDE,
  LOGO_ANAPAULA_ALTURA_EMU,
  LOGO_ANAPAULA_JPEG_BASE64,
  LOGO_ANAPAULA_LARGURA_EMU,
  LOGO_HUMANA_ALTURA_EMU,
  LOGO_HUMANA_LARGURA_EMU,
  LOGO_HUMANA_PNG_BASE64,
  emuParaPolegadas,
  type FormaDecorativa,
} from "@main/assets/identidadeVisual";
import { lerDimensoesImagem } from "@main/export/dimensoesImagem";

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

function imgLogo(base64: string, mime: string, leftEmu: number, larguraEmu: number, alt: string): string {
  const estilo = [
    `left:${emuParaPolegadas(leftEmu)}in`,
    `top:${emuParaPolegadas(DISTANCIA_CABECALHO_EMU + 40000)}in`,
    `width:${emuParaPolegadas(larguraEmu)}in`,
    `height:${emuParaPolegadas(ALTURA_LOGO_EMU)}in`,
  ].join(";");
  return `<img class="logo" style="${estilo}" src="data:${mime};base64,${base64}" alt="${escaparHtml(alt)}"/>`;
}

function htmlLogo(identidade: IdentidadeVisualConfig): string {
  const larguraConteudoEmu = PAGINA_LARGURA_EMU - MARGEM_ESQUERDA_EMU - MARGEM_DIREITA_EMU;

  if (identidade.logoBase64 && identidade.logoMime) {
    const dimensoes = lerDimensoesImagem(identidade.logoBase64, identidade.logoMime);
    const larguraLogoEmu = Math.round(ALTURA_LOGO_EMU * (dimensoes.larguraPx / dimensoes.alturaPx));
    const leftEmu = MARGEM_ESQUERDA_EMU + Math.max(0, Math.round((larguraConteudoEmu - larguraLogoEmu) / 2));
    return imgLogo(identidade.logoBase64, identidade.logoMime, leftEmu, larguraLogoEmu, "Logo do relatório");
  }

  const larguraHumanaEmu = Math.round(ALTURA_LOGO_EMU * (LOGO_HUMANA_LARGURA_EMU / LOGO_HUMANA_ALTURA_EMU));
  const larguraAnaPaulaEmu = Math.round(ALTURA_LOGO_EMU * (LOGO_ANAPAULA_LARGURA_EMU / LOGO_ANAPAULA_ALTURA_EMU));
  const margemInternaEmu = 40000;
  const inicioEmu = MARGEM_ESQUERDA_EMU + Math.max(margemInternaEmu, larguraConteudoEmu - larguraHumanaEmu - margemInternaEmu);

  return [
    imgLogo(LOGO_HUMANA_PNG_BASE64, "image/png", inicioEmu, larguraHumanaEmu, "Logo Humana Clínica de Saúde Integrada"),
    imgLogo(
      LOGO_ANAPAULA_JPEG_BASE64,
      "image/jpeg",
      MARGEM_ESQUERDA_EMU + margemInternaEmu,
      larguraAnaPaulaEmu,
      "Logo Ana Paula M. Gontijo, Neuropsicopedagoga",
    ),
  ].join("\n");
}

function itemHtml(rotulo: string, valor: string): string {
  return `<p class="item"><b>${escaparHtml(rotulo)}:</b> ${escaparHtml(valor)}</p>`;
}

function htmlTextoIa(textoBruto: string): string {
  const linhas = formatarTextoIa(textoBruto);
  return linhas
    .map((linha) => {
      const conteudo = linha.spans
        .map((span) => (span.negrito ? `<b>${escaparHtml(span.texto)}</b>` : escaparHtml(span.texto)))
        .join("");
      return `<p>${conteudo}</p>`;
    })
    .join("\n");
}

export function montarHtmlRelatorioAvaliativo(
  conteudo: ConteudoRelatorioAvaliativo,
  identidade: IdentidadeVisualConfig,
): string {
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
  <h1 class="titulo">RELATÓRIO AVALIATIVO</h1>
  <h3 class="secao">Dados do paciente</h3>
  ${itemHtml("Nome", conteudo.nomeCrianca)}
  ${itemHtml("Idade", conteudo.idade)}
  ${itemHtml("Data de nascimento", conteudo.dataNascimento)}
  ${itemHtml("Série/ano escolar", conteudo.serie)}
  ${itemHtml("Turno", conteudo.turno)}
  ${itemHtml("Escola", conteudo.escola)}
  ${itemHtml("Nome dos responsáveis", conteudo.nomeResponsaveis)}
  ${itemHtml("Data do início da avaliação", conteudo.dataInicioAvaliacao)}
  ${itemHtml("Data de encerramento", conteudo.dataEncerramento)}
  ${itemHtml("Profissional responsável", `${conteudo.tituloProfissional} ${conteudo.nomeProfissional}`)}

  <h3 class="secao">Objetivo da Avaliação</h3>
  ${htmlTextoIa(conteudo.objetivoAvaliacao)}

  <h3 class="secao">Histórico Escolar e Familiar</h3>
  ${htmlTextoIa(conteudo.historicoEscolarFamiliar)}

  <h3 class="secao">Aspectos Emocionais e Comportamentais</h3>
  ${htmlTextoIa(conteudo.aspectosEmocionaisComportamentais)}

  <h3 class="secao">Metodologia da avaliação</h3>
  ${htmlTextoIa(conteudo.metodologiaAvaliacao)}

  <h3 class="secao">Aspectos Cognitivos e de Aprendizagem</h3>
  ${htmlTextoIa(conteudo.aspectosCognitivosAprendizagem)}

  <h3 class="secao">Instrumentos Utilizados</h3>
  ${htmlTextoIa(conteudo.instrumentosUtilizados)}

  <h3 class="secao">Resultados da Avaliação</h3>
  ${htmlTextoIa(conteudo.resultadosAvaliacao)}

  <h3 class="secao">Intervenções Aplicadas</h3>
  ${htmlTextoIa(conteudo.intervencoesAplicadas)}

  <h3 class="secao">Recomendações</h3>
  ${htmlTextoIa(conteudo.recomendacoes)}

  <p class="assinatura">
    __________________________________<br/>
    ${escaparHtml(conteudo.nomeProfissional)}<br/>
    ${escaparHtml(conteudo.tituloProfissional)}
  </p>
</div>
</body>
</html>`;
}

export async function gerarPdfRelatorioAvaliativo(
  conteudo: ConteudoRelatorioAvaliativo,
  identidade: IdentidadeVisualConfig,
): Promise<Uint8Array> {
  const html = montarHtmlRelatorioAvaliativo(conteudo, identidade);
  const pastaTemp = mkdtempSync(path.join(app.getPath("temp"), "relatorio-avaliativo-pdf-"));
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
