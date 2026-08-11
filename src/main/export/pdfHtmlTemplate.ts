import type { ConteudoFicha } from "@core/services/anamneseContent";
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
  MARGEM_ESQUERDA_EMU,
  emuParaPolegadas,
  type FormaDecorativa,
} from "@main/assets/identidadeVisual";

// Distância do topo da página até a área do cabeçalho, extraída do w:pgMar original
// (w:header="426" twips = 270510 EMU) — ver anamnese_identidade_visual.md.
const DISTANCIA_CABECALHO_EMU = 270510;

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

function imgLogo(opcoes: {
  base64: string;
  mime: string;
  larguraEmu: number;
  alturaEmu: number;
  offsetXEmu: number;
  offsetYEmu: number;
  alt: string;
}): string {
  const leftEmu = MARGEM_ESQUERDA_EMU + opcoes.offsetXEmu;
  const topEmu = DISTANCIA_CABECALHO_EMU + opcoes.offsetYEmu;
  const estilo = [
    `left:${emuParaPolegadas(leftEmu)}in`,
    `top:${emuParaPolegadas(topEmu)}in`,
    `width:${emuParaPolegadas(opcoes.larguraEmu)}in`,
    `height:${emuParaPolegadas(opcoes.alturaEmu)}in`,
  ].join(";");
  return `<img class="logo" style="${estilo}" src="data:${opcoes.mime};base64,${opcoes.base64}" alt="${escaparHtml(opcoes.alt)}"/>`;
}

function tabelaFamiliaresHtml(familiares: ConteudoFicha["familiares"]): string {
  if (familiares.length === 0) {
    return "<p>Nenhum familiar cadastrado.</p>";
  }
  const linhas = familiares
    .map((f) => `<tr><td>${escaparHtml(f.nome)}</td><td>${escaparHtml(f.idade)}</td><td>${escaparHtml(f.relacao)}</td></tr>`)
    .join("");
  return `<table><thead><tr><th>Nome</th><th>Idade</th><th>Relação</th></tr></thead><tbody>${linhas}</tbody></table>`;
}

export function montarHtmlFicha(conteudo: ConteudoFicha): string {
  const decoracoes = [
    svgFormaDecorativa(BORDA_VERDE, "cabecalho"),
    svgFormaDecorativa(BORDA_ROXA, "cabecalho"),
    svgFormaDecorativa(BORDA_VERDE, "rodape"),
    svgFormaDecorativa(BORDA_ROXA, "rodape"),
  ].join("\n");

  const logos = [
    imgLogo({
      base64: LOGO_ANAPAULA_JPEG_BASE64,
      mime: "image/jpeg",
      larguraEmu: LOGO_ANAPAULA_LARGURA_EMU,
      alturaEmu: LOGO_ANAPAULA_ALTURA_EMU,
      offsetXEmu: LOGO_ANAPAULA_OFFSET_X_EMU,
      offsetYEmu: LOGO_ANAPAULA_OFFSET_Y_EMU,
      alt: "Logo Ana Paula M. Gontijo",
    }),
    imgLogo({
      base64: LOGO_HUMANA_PNG_BASE64,
      mime: "image/png",
      larguraEmu: LOGO_HUMANA_LARGURA_EMU,
      alturaEmu: LOGO_HUMANA_ALTURA_EMU,
      offsetXEmu: LOGO_HUMANA_OFFSET_X_EMU,
      offsetYEmu: LOGO_HUMANA_OFFSET_Y_EMU,
      alt: "Logo Humana Clínica",
    }),
  ].join("\n");

  const secoesHtml = conteudo.secoes
    .map((secao) => {
      const itensHtml = secao.itens
        .map((item) => `<p class="item"><b>${escaparHtml(item.rotulo)}:</b> ${comQuebrasDeLinha(item.valor)}</p>`)
        .join("\n");
      const tabela = secao.id === "composicao_familiar" ? tabelaFamiliaresHtml(conteudo.familiares) : "";
      return `<h3 class="secao">${escaparHtml(secao.titulo.toUpperCase())}</h3>\n${itensHtml}\n${tabela}`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; }
  .forma-decorativa, .logo { position: fixed; z-index: 0; }
  .conteudo { position: relative; z-index: 1; padding: 2.5cm 2.25cm 1cm 2.5cm; }
  h1.titulo-ficha { text-align: center; font-size: 20pt; margin: 0 0 4pt; }
  h2.nome-crianca { text-align: center; font-size: 15pt; margin: 0 0 18pt; }
  h3.secao { font-size: 12.5pt; margin: 16pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 2pt; }
  p.item { margin: 2pt 0; font-size: 10.5pt; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 10pt; }
  th, td { border: 1px solid #999; padding: 4pt 6pt; text-align: left; }
  .assinatura { text-align: center; margin-top: 10pt; }
  .rodape-info { font-size: 9pt; color: #666; margin-top: 24pt; }
</style>
</head>
<body>
${decoracoes}
${logos}
<div class="conteudo">
  <h1 class="titulo-ficha">FICHA DE ANAMNESE</h1>
  <h2 class="nome-crianca">${escaparHtml(conteudo.nomeCrianca)}</h2>
  ${secoesHtml}
  <p class="rodape-info">Documento gerado em ${escaparHtml(new Date(conteudo.geradoEm).toLocaleString("pt-BR"))}.</p>
  <p class="assinatura">___________________________________<br/>Assinatura Responsável</p>
  <p class="assinatura">___________________________________<br/>Assinatura ${escaparHtml(conteudo.tituloProfissional)}</p>
</div>
</body>
</html>`;
}
