import JSZip from "jszip";
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
} from "@main/assets/identidadeVisual";
import { escaparXml, xmlFormaDecorativa, xmlImagemAncorada } from "@main/export/docxXmlHelpers";

const NAMESPACES_WORDML =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

function paragrafo(texto: string, opcoes: { negrito?: boolean; tamanho?: number; centralizado?: boolean } = {}): string {
  const { negrito, tamanho, centralizado } = opcoes;
  const rPr = [negrito ? "<w:b/>" : "", tamanho ? `<w:sz w:val="${tamanho}"/><w:szCs w:val="${tamanho}"/>` : ""].join("");
  const pPr = centralizado ? "<w:pPr><w:jc w:val=\"center\"/></w:pPr>" : "";
  const linhas = texto.split("\n");
  const runs = linhas
    .map((linha, indice) => {
      const quebra = indice < linhas.length - 1 ? "<w:br/>" : "";
      return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escaparXml(linha)}</w:t>${quebra ? "" : ""}</w:r>${quebra ? `<w:r>${quebra}</w:r>` : ""}`;
    })
    .join("");
  return `<w:p>${pPr}${runs}</w:p>`;
}

function paragrafoItem(rotulo: string, valor: string): string {
  return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(rotulo)}: </w:t></w:r><w:r><w:t xml:space="preserve">${escaparXml(valor)}</w:t></w:r></w:p>`;
}

function tabelaFamiliares(familiares: ConteudoFicha["familiares"]): string {
  if (familiares.length === 0) {
    return paragrafo("Nenhum familiar cadastrado.");
  }

  const celula = (texto: string, cabecalho = false): string =>
    `<w:tc><w:tcPr><w:tcBorders><w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/></w:tcBorders></w:tcPr><w:p>${
      cabecalho ? `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(texto)}</w:t></w:r>` : `<w:r><w:t xml:space="preserve">${escaparXml(texto)}</w:t></w:r>`
    }</w:p></w:tc>`;

  const linhaCabecalho = `<w:tr>${celula("Nome", true)}${celula("Idade", true)}${celula("Relação", true)}</w:tr>`;
  const linhas = familiares
    .map((f) => `<w:tr>${celula(f.nome)}${celula(f.idade)}${celula(f.relacao)}</w:tr>`)
    .join("");

  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:color="auto"/></w:tblBorders></w:tblPr>${linhaCabecalho}${linhas}</w:tbl>`;
}

function montarCorpoDocumento(conteudo: ConteudoFicha): string {
  const partes: string[] = [];

  partes.push(paragrafo("FICHA DE ANAMNESE", { negrito: true, tamanho: 32, centralizado: true }));
  partes.push(paragrafo(conteudo.nomeCrianca, { negrito: true, tamanho: 24, centralizado: true }));
  partes.push(paragrafo(" "));

  for (const secao of conteudo.secoes) {
    partes.push(paragrafo(secao.titulo.toUpperCase(), { negrito: true, tamanho: 24 }));
    for (const item of secao.itens) {
      partes.push(paragrafoItem(item.rotulo, item.valor));
    }
    if (secao.id === "composicao_familiar") {
      partes.push(tabelaFamiliares(conteudo.familiares));
    }
    partes.push(paragrafo(" "));
  }

  partes.push(paragrafo(" "));
  partes.push(
    paragrafo(`Documento gerado em ${new Date(conteudo.geradoEm).toLocaleString("pt-BR")}.`, { tamanho: 18 }),
  );
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo("Assinatura Responsável", { centralizado: true }));
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo(`Assinatura ${conteudo.tituloProfissional}`, { centralizado: true }));

  return partes.join("");
}

function montarDocumentXml(conteudo: ConteudoFicha): string {
  const corpo = montarCorpoDocumento(conteudo);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NAMESPACES_WORDML}><w:body>${corpo}
<w:sectPr>
<w:headerReference w:type="default" r:id="rId2"/>
<w:footerReference w:type="default" r:id="rId3"/>
<w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1417" w:right="1274" w:bottom="567" w:left="1418" w:header="426" w:footer="708" w:gutter="0"/>
<w:cols w:space="708"/>
</w:sectPr>
</w:body></w:document>`;
}

function montarHeaderXml(conteudo: ConteudoFicha): string {
  const logoAnaPaula = xmlImagemAncorada({
    relationId: "rId1",
    nome: "Logo Ana Paula M. Gontijo",
    larguraEmu: LOGO_ANAPAULA_LARGURA_EMU,
    alturaEmu: LOGO_ANAPAULA_ALTURA_EMU,
    offsetXEmu: LOGO_ANAPAULA_OFFSET_X_EMU,
    offsetYEmu: LOGO_ANAPAULA_OFFSET_Y_EMU,
  });
  const logoHumana = xmlImagemAncorada({
    relationId: "rId2",
    nome: "Logo Humana Clínica",
    larguraEmu: LOGO_HUMANA_LARGURA_EMU,
    alturaEmu: LOGO_HUMANA_ALTURA_EMU,
    offsetXEmu: LOGO_HUMANA_OFFSET_X_EMU,
    offsetYEmu: LOGO_HUMANA_OFFSET_Y_EMU,
  });
  const formaVerde = xmlFormaDecorativa(BORDA_VERDE, "cabecalho");
  const formaRoxa = xmlFormaDecorativa(BORDA_ROXA, "cabecalho");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr ${NAMESPACES_WORDML} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
${formaVerde}${formaRoxa}
<w:p>${logoAnaPaula.replace("<w:p>", "").replace("</w:p>", "")}${logoHumana.replace("<w:p>", "").replace("</w:p>", "")}</w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(
    conteudo.tituloProfissional.toUpperCase(),
  )}</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(
    conteudo.nomeProfissional,
  )}</w:t></w:r></w:p>
</w:hdr>`;
}

function montarFooterXml(): string {
  const formaVerde = xmlFormaDecorativa(BORDA_VERDE, "rodape");
  const formaRoxa = xmlFormaDecorativa(BORDA_ROXA, "rodape");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${NAMESPACES_WORDML} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
${formaVerde}${formaRoxa}
</w:ftr>`;
}

function montarStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;
}

function montarContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Default Extension="jpeg" ContentType="image/jpeg"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;
}

function montarRelsRaiz(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function montarDocumentRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;
}

function montarHeaderRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo-anapaula.jpeg"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo-humana.png"/>
</Relationships>`;
}

export async function gerarDocxAnamnese(conteudo: ConteudoFicha): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file("[Content_Types].xml", montarContentTypesXml());
  zip.folder("_rels")?.file(".rels", montarRelsRaiz());

  const pastaWord = zip.folder("word");
  pastaWord?.file("document.xml", montarDocumentXml(conteudo));
  pastaWord?.file("styles.xml", montarStylesXml());
  pastaWord?.file("header1.xml", montarHeaderXml(conteudo));
  pastaWord?.file("footer1.xml", montarFooterXml());
  pastaWord?.folder("_rels")?.file("document.xml.rels", montarDocumentRels());
  pastaWord?.folder("_rels")?.file("header1.xml.rels", montarHeaderRels());

  const pastaMedia = pastaWord?.folder("media");
  pastaMedia?.file("logo-humana.png", LOGO_HUMANA_PNG_BASE64, { base64: true });
  pastaMedia?.file("logo-anapaula.jpeg", LOGO_ANAPAULA_JPEG_BASE64, { base64: true });

  return zip.generateAsync({ type: "uint8array" });
}
