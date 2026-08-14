import { ANAMNESE_SCHEMA, encontrarCampo } from "@core/data/anamneseSchema";
import { MODELO_ANAMNESE_ORIGINAL, type LinhaModelo, type SegmentoLinha } from "@core/data/anamneseModeloOriginal";
import type { ConteudoFicha } from "@core/services/anamneseContent";
import { opcaoEstaSelecionada, resolverCampoFicha, resolverValorCampo } from "@core/services/anamneseModeloResolver";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import type { Ficha } from "@core/db/types";
import {
  BORDA_ROXA,
  BORDA_VERDE,
  LOGO_ANAPAULA_ALTURA_EMU,
  LOGO_ANAPAULA_JPEG_BASE64,
  LOGO_ANAPAULA_LARGURA_EMU,
  LOGO_ANAPAULA_OFFSET_X_EMU,
  LOGO_ANAPAULA_OFFSET_Y_EMU,
  LOGO_HUMANA_ALTURA_EMU,
  LOGO_HUMANA_LARGURA_EMU,
  LOGO_HUMANA_OFFSET_X_EMU,
  LOGO_HUMANA_OFFSET_Y_EMU,
  LOGO_HUMANA_PNG_BASE64,
  MARGEM_DIREITA_EMU,
  MARGEM_ESQUERDA_EMU,
  PAGINA_LARGURA_EMU,
  emuParaPolegadas,
  type FormaDecorativa,
} from "@main/assets/identidadeVisual";
import { lerDimensoesImagem } from "@main/export/dimensoesImagem";

// Distância do topo da página até a área do cabeçalho, extraída do w:pgMar original
// (w:header="426" twips = 270510 EMU) — ver anamnese_identidade_visual.md.
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

// "\t" do modelo (ver anamneseModeloOriginal.ts) vira um espaçador de largura fixa — HTML/CSS não
// tem tabulação de verdade como o Word.
function comEspacamento(texto: string): string {
  return escaparHtml(texto).split("\t").join('<span class="tab"></span>');
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

function imgCanto(base64: string, mime: string, pos: { xEmu: number; yEmu: number; larguraEmu: number; alturaEmu: number }, alt: string): string {
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

function imgLogo(
  base64: string,
  mime: string,
  pos: { xEmu: number; yEmu: number; larguraEmu: number; alturaEmu: number },
  alt: string,
): string {
  const estilo = [
    `left:${emuParaPolegadas(MARGEM_ESQUERDA_EMU + pos.xEmu)}in`,
    `top:${emuParaPolegadas(DISTANCIA_CABECALHO_EMU + pos.yEmu)}in`,
    `width:${emuParaPolegadas(pos.larguraEmu)}in`,
    `height:${emuParaPolegadas(pos.alturaEmu)}in`,
  ].join(";");
  return `<img class="logo" style="${estilo}" src="data:${mime};base64,${base64}" alt="${escaparHtml(alt)}"/>`;
}

interface LogoRenderizado {
  html: string;
  // Ponto mais baixo (EMU, a partir do topo da página) entre as logos renderizadas — usado pra
  // calcular o padding-top do conteúdo dinamicamente. Diferente do DOCX (onde o Word empurra o
  // corpo do texto pra baixo sozinho quando o cabeçalho é mais alto que a margem), HTML/CSS não
  // faz isso: um padding-top fixo demais pequeno deixa o texto por cima da logo.
  bordaInferiorEmu: number;
}

// Logo custom do Perfil (se configurada) OU, por padrão, as 2 logos originais do modelo — mesmo
// fallback de docxAnamneseBuilder.ts (resolverImagensLogo).
function htmlLogo(identidade: IdentidadeVisualConfig): LogoRenderizado {
  if (identidade.logoBase64 && identidade.logoMime) {
    const dimensoes = lerDimensoesImagem(identidade.logoBase64, identidade.logoMime);
    const larguraLogoEmu = Math.round(ALTURA_LOGO_EMU * (dimensoes.larguraPx / dimensoes.alturaPx));
    const larguraConteudoEmu = PAGINA_LARGURA_EMU - MARGEM_ESQUERDA_EMU - MARGEM_DIREITA_EMU;
    const offsetXEmu = Math.max(0, Math.round((larguraConteudoEmu - larguraLogoEmu) / 2));
    const pos = { xEmu: offsetXEmu, yEmu: 40000, larguraEmu: larguraLogoEmu, alturaEmu: ALTURA_LOGO_EMU };
    return {
      html: imgLogo(identidade.logoBase64, identidade.logoMime, pos, "Logo do relatório"),
      bordaInferiorEmu: DISTANCIA_CABECALHO_EMU + pos.yEmu + pos.alturaEmu,
    };
  }

  const posHumana = {
    xEmu: LOGO_HUMANA_OFFSET_X_EMU,
    yEmu: LOGO_HUMANA_OFFSET_Y_EMU,
    larguraEmu: LOGO_HUMANA_LARGURA_EMU,
    alturaEmu: LOGO_HUMANA_ALTURA_EMU,
  };
  const posAnaPaula = {
    xEmu: LOGO_ANAPAULA_OFFSET_X_EMU,
    yEmu: LOGO_ANAPAULA_OFFSET_Y_EMU,
    larguraEmu: LOGO_ANAPAULA_LARGURA_EMU,
    alturaEmu: LOGO_ANAPAULA_ALTURA_EMU,
  };
  const html = [
    imgLogo(LOGO_HUMANA_PNG_BASE64, "image/png", posHumana, "Logo Humana Clínica de Saúde Integrada"),
    imgLogo(LOGO_ANAPAULA_JPEG_BASE64, "image/jpeg", posAnaPaula, "Logo Ana Paula M. Gontijo, Neuropsicopedagoga"),
  ].join("\n");
  const bordaInferiorEmu = Math.max(
    DISTANCIA_CABECALHO_EMU + posHumana.yEmu + posHumana.alturaEmu,
    DISTANCIA_CABECALHO_EMU + posAnaPaula.yEmu + posAnaPaula.alturaEmu,
  );
  return { html, bordaInferiorEmu };
}

function tabelaFamiliaresHtml(familiares: ConteudoFicha["familiares"]): string {
  if (familiares.length === 0) {
    return "<p>Nenhum familiar cadastrado.</p>";
  }
  const linhas = familiares
    .map((f) => `<tr><td>${escaparHtml(f.nome)}</td><td>${escaparHtml(f.idade)}</td><td>${escaparHtml(f.relacao)}</td></tr>`)
    .join("");
  return `<table class="familiares"><thead><tr><th>Nome</th><th>Idade</th><th>Relação</th></tr></thead><tbody>${linhas}</tbody></table>`;
}

// Grade 4x8 sem bordas — mesma ordem/agrupamento de docxAnamneseBuilder.ts (tabelaHistoriaClinica).
function tabelaHistoriaClinicaHtml(respostas: Map<string, string>): string {
  const campo = encontrarCampo("historia_clinica.doencas");
  const doencas = campo?.opcoes ?? [];
  const linhas: string[] = [];
  for (let i = 0; i < doencas.length; i += 4) {
    const grupo = doencas.slice(i, i + 4);
    const celulas = grupo
      .map((doenca) => {
        const marcado = opcaoEstaSelecionada("historia_clinica.doencas", doenca, respostas);
        return `<td class="checkbox">${marcado ? "X" : ""}</td><td>${escaparHtml(doenca)}</td>`;
      })
      .join("");
    linhas.push(`<tr>${celulas}</tr>`);
  }
  return `<table class="historia-clinica">${linhas.join("")}</table>`;
}

function renderizarSegmentoHtml(
  segmento: SegmentoLinha,
  ficha: Ficha,
  respostas: Map<string, string>,
  negritoLinha: boolean | undefined,
): string {
  const negrito = (segmento.tipo === "texto" && segmento.negrito) || negritoLinha;
  const abrir = negrito ? "<b>" : "";
  const fechar = negrito ? "</b>" : "";

  if (segmento.tipo === "texto") return `${abrir}${comEspacamento(segmento.texto)}${fechar}`;
  if (segmento.tipo === "campo") return `${abrir}${comQuebrasDeLinha(resolverValorCampo(segmento.campoId, respostas))}${fechar}`;
  if (segmento.tipo === "campo_ficha") return `${abrir}${escaparHtml(resolverCampoFicha(segmento.campo, ficha))}${fechar}`;

  const marcado = opcaoEstaSelecionada(segmento.campoId, segmento.opcao, respostas);
  return `${abrir}${escaparHtml(`(${marcado ? "X" : "  "}) ${segmento.rotulo}`)}${fechar}`;
}

function paragrafoLinhaHtml(linhaModelo: LinhaModelo, ficha: Ficha, respostas: Map<string, string>): string {
  const conteudo = linhaModelo.segmentos
    .map((segmento) => renderizarSegmentoHtml(segmento, ficha, respostas, linhaModelo.negrito))
    .join("");
  return `<p class="linha">${conteudo}</p>`;
}

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataPorExtenso(data: Date): string {
  return `${data.getDate()} de ${MESES_PT[data.getMonth()]} de ${data.getFullYear()}`;
}

// Reproduz o texto corrido do documento-modelo (MODELO_ANAMNESE_ORIGINAL), igual ao
// docxAnamneseBuilder.ts — ver anamneseModeloOriginal.ts pro porquê.
export function montarHtmlFicha(
  ficha: Ficha,
  conteudo: ConteudoFicha,
  respostas: Map<string, string>,
  identidade: IdentidadeVisualConfig,
): string {
  const secoesHtml = ANAMNESE_SCHEMA.map((secaoSchema) => {
    const secaoModelo = MODELO_ANAMNESE_ORIGINAL.find((s) => s.secaoId === secaoSchema.id);
    const partes: string[] = [`<h3 class="secao">${escaparHtml(secaoSchema.titulo.toUpperCase())}</h3>`];

    if (secaoSchema.id === "historia_clinica") {
      partes.push(tabelaHistoriaClinicaHtml(respostas));
    }
    if (secaoModelo) {
      for (const linhaModelo of secaoModelo.linhas) {
        partes.push(paragrafoLinhaHtml(linhaModelo, ficha, respostas));
      }
    }
    if (secaoSchema.id === "composicao_familiar") {
      partes.push(tabelaFamiliaresHtml(conteudo.familiares));
    }
    return partes.join("\n");
  }).join("\n");

  const dataAssinatura = dataPorExtenso(new Date(conteudo.geradoEm));
  const logo = htmlLogo(identidade);
  // HTML/CSS não empurra o corpo do texto pra baixo sozinho quando o cabeçalho é mais alto que a
  // margem (diferente do Word) — por isso o padding-top é o maior entre a margem original e a
  // borda inferior real da(s) logo(s) renderizada(s), com uma folga pra não ficar colado.
  const paddingTopoCm = Math.max(2.5, emuParaPolegadas(logo.bordaInferiorEmu + 40000) * 2.54);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.35; }
  .forma-decorativa, .logo { position: fixed; z-index: 0; }
  .conteudo { position: relative; z-index: 1; padding: ${paddingTopoCm}cm 2.25cm 1cm 2.5cm; text-align: justify; }
  h3.secao { font-size: 11pt; font-weight: bold; margin: 10pt 0 4pt; }
  p.linha { margin: 1pt 0; }
  .tab { display: inline-block; width: 2em; }
  table.familiares { border-collapse: collapse; width: 100%; margin: 4pt 0; font-size: 10.5pt; }
  table.familiares th, table.familiares td { border: 1px solid #333; padding: 3pt 6pt; text-align: left; }
  table.historia-clinica { border-collapse: collapse; margin: 4pt 0; font-size: 10.5pt; }
  table.historia-clinica td { padding: 1pt 4pt; }
  table.historia-clinica td.checkbox { width: 1em; text-align: center; font-weight: bold; }
  .assinatura { text-align: center; margin-top: 10pt; }
</style>
</head>
<body>
${htmlBorda(identidade)}
${logo.html}
<div class="conteudo">
  ${secoesHtml}
  <p class="linha">Santa Helena de Goiás, ${escaparHtml(dataAssinatura)}.</p>
  <p class="assinatura">___________________________________<br/>Assinatura Responsável</p>
  <p class="assinatura">___________________________________<br/>Assinatura Responsável</p>
  <p class="assinatura">___________________________________<br/>Assinatura ${escaparHtml(conteudo.tituloProfissional)}</p>
  <p class="assinatura">___________________________________<br/>Assinatura ${escaparHtml(conteudo.tituloProfissional)}</p>
</div>
</body>
</html>`;
}
