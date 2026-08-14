import type { FormaDecorativa } from "@main/assets/identidadeVisual";
import { formatarTextoIa } from "@core/services/textoIaFormatado";

// JSZip aceita string direto em zip.file(), mas isso já causou acentuação corrompida (mojibake:
// "IDENTIFICAÇÃO" virando "IDENTIFICAÃ‡ÃƒO") especificamente rodando dentro do app Electron
// empacotado/dev — não reproduz em script standalone via tsx. Codificar pra bytes UTF-8 na mão
// evita depender do encoder de string interno do JSZip nesse ambiente.
export function utf8Bytes(texto: string): Uint8Array {
  return Buffer.from(texto, "utf8");
}

// Mesma cautela do utf8Bytes, mas pro caminho inverso: em vez de deixar o JSZip decodificar a
// string base64 internamente (opção { base64: true }), decodifica na mão e entrega os bytes já
// prontos. As imagens (logo/borda) usavam { base64: true } e continuavam arriscando o mesmo tipo
// de bug de processamento de string do JSZip nesse ambiente — ver utf8Bytes.
export function base64Bytes(base64: string): Uint8Array {
  return Buffer.from(base64, "base64");
}

export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Converte "M x,y L x,y L x,y ... Z" (mesma notação do path SVG documentado na memória do
// projeto) para a sequência <a:moveTo>/<a:lnTo>/<a:close> que o custGeom do OOXML espera.
export function pathParaOOXML(path: string): string {
  const comandos = path.trim().split(/\s+/);
  const partes: string[] = [];

  for (const comando of comandos) {
    if (comando === "Z" || comando === "z") {
      partes.push("<a:close/>");
      continue;
    }
    const tipo = comando[0];
    const coordenadas = comando.slice(1);
    const [x, y] = coordenadas.split(",");
    if (tipo === "M") {
      partes.push(`<a:moveTo><a:pt x="${x}" y="${y}"/></a:moveTo>`);
    } else if (tipo === "L") {
      partes.push(`<a:lnTo><a:pt x="${x}" y="${y}"/></a:lnTo>`);
    }
  }

  return partes.join("");
}

let proximoIdDesenho = 900;

export function xmlFormaDecorativa(forma: FormaDecorativa, instancia: "cabecalho" | "rodape"): string {
  const pos = instancia === "cabecalho" ? forma.cabecalho : forma.rodape;
  const id = proximoIdDesenho++;
  const flipAttr = pos.flipH || pos.flipV ? ` flipH="${pos.flipH ? 1 : 0}" flipV="${pos.flipV ? 1 : 0}"` : "";
  const corSemHash = forma.corHex.replace("#", "");
  const alphaXml = forma.alpha < 1 ? `<a:alpha val="${Math.round(forma.alpha * 100000)}"/>` : "";

  return `<w:p><w:r><w:rPr><w:noProof/></w:rPr><w:drawing>
<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${251600000 + id}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
<wp:simplePos x="0" y="0"/>
<wp:positionH relativeFrom="page"><wp:posOffset>${pos.xEmu}</wp:posOffset></wp:positionH>
<wp:positionV relativeFrom="page"><wp:posOffset>${pos.yEmu}</wp:posOffset></wp:positionV>
<wp:extent cx="${pos.larguraEmu}" cy="${pos.alturaEmu}"/>
<wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:wrapNone/>
<wp:docPr id="${id}" name="Forma decorativa ${id}"/>
<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/></wp:cNvGraphicFramePr>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
<wps:wsp xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
<wps:cNvSpPr><a:spLocks/></wps:cNvSpPr>
<wps:spPr>
<a:xfrm${flipAttr}><a:off x="0" y="0"/><a:ext cx="${pos.larguraEmu}" cy="${pos.alturaEmu}"/></a:xfrm>
<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="l" t="t" r="r" b="b"/>
<a:pathLst><a:path w="${forma.viewBoxLargura}" h="${forma.viewBoxAltura}">${pathParaOOXML(forma.path)}</a:path></a:pathLst>
</a:custGeom>
<a:solidFill><a:srgbClr val="${corSemHash}">${alphaXml}</a:srgbClr></a:solidFill>
</wps:spPr>
<wps:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"><a:prstTxWarp prst="textNoShape"><a:avLst/></a:prstTxWarp><a:noAutofit/></wps:bodyPr>
</wps:wsp>
</a:graphicData>
</a:graphic>
</wp:anchor>
</w:drawing></w:r></w:p>`;
}

export interface OpcoesImagemAncorada {
  relationId: string;
  nome: string;
  larguraEmu: number;
  alturaEmu: number;
  offsetXEmu: number;
  offsetYEmu: number;
  relativeFrom?: "columnParagraph" | "page";
}

// Só o <w:r>...<w:drawing>...</w:drawing></w:r> — sem o <w:p> em volta. Existe pra permitir
// ancorar 2+ imagens no MESMO parágrafo (necessário quando a posição é relativeFrom="paragraph":
// cada parágrafo novo desloca o "topo" de referência, então duas imagens que devem ficar na
// mesma "linha zero" do cabeçalho — como as 2 logos do modelo original — têm que estar juntas no
// mesmo <w:p>, não em parágrafos separados).
export function xmlRunImagemAncorada(opcoes: OpcoesImagemAncorada): string {
  const id = proximoIdDesenho++;
  const [relFromH, relFromV] = opcoes.relativeFrom === "page" ? ["page", "page"] : ["column", "paragraph"];
  return `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing>
<wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="${251600000 + id}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
<wp:simplePos x="0" y="0"/>
<wp:positionH relativeFrom="${relFromH}"><wp:posOffset>${opcoes.offsetXEmu}</wp:posOffset></wp:positionH>
<wp:positionV relativeFrom="${relFromV}"><wp:posOffset>${opcoes.offsetYEmu}</wp:posOffset></wp:positionV>
<wp:extent cx="${opcoes.larguraEmu}" cy="${opcoes.alturaEmu}"/>
<wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:wrapNone/>
<wp:docPr id="${id}" name="${escaparXml(opcoes.nome)}"/>
<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:nvPicPr><pic:cNvPr id="0" name="${escaparXml(opcoes.nome)}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="${opcoes.relationId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="${opcoes.larguraEmu}" cy="${opcoes.alturaEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></pic:spPr>
</pic:pic>
</a:graphicData>
</a:graphic>
</wp:anchor>
</w:drawing></w:r>`;
}

export function xmlImagemAncorada(opcoes: OpcoesImagemAncorada): string {
  return `<w:p>${xmlRunImagemAncorada(opcoes)}</w:p>`;
}

// Renderiza texto gerado por IA (Sugestão de Intervenção / Relatório Final) interpretando a
// formatação markdown leve que a IA às vezes usa (ver textoIaFormatado.ts) em vez de despejar o
// texto bruto — sem isso, "**"/"#"/"---" apareciam literalmente no documento. Uma linha =
// um <w:p> próprio (não <w:br/> dentro de um único parágrafo) para não sofrer o estica-mento de
// espaçamento que o Word aplica a linhas manualmente quebradas dentro de um parágrafo justificado.
export function paragrafoTextoIa(textoBruto: string): string {
  const linhas = formatarTextoIa(textoBruto);
  if (linhas.length === 0) return "";

  return linhas
    .map((linha) => {
      const runs = linha.spans
        .map((span) => {
          if (!span.texto) return "";
          const rPr = span.negrito ? "<w:rPr><w:b/></w:rPr>" : "";
          return `<w:r>${rPr}<w:t xml:space="preserve">${escaparXml(span.texto)}</w:t></w:r>`;
        })
        .join("");
      return `<w:p><w:pPr><w:spacing w:before="120"/></w:pPr>${runs}</w:p>`;
    })
    .join("");
}
