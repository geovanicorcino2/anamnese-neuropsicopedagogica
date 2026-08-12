import JSZip from "jszip";
import type { ConteudoRelatorioFinal } from "@core/services/relatorioFinalContent";
import type { IdentidadeVisualConfig } from "@core/services/identidadeVisualConfig";
import { BORDA_ROXA, BORDA_VERDE, PAGINA_LARGURA_EMU } from "@main/assets/identidadeVisual";
import { escaparXml, xmlFormaDecorativa, xmlImagemAncorada } from "@main/export/docxXmlHelpers";
import { lerDimensoesImagem } from "@main/export/dimensoesImagem";

const NAMESPACES_WORDML =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

const ALTURA_LOGO_EMU = 900000;

// ABNT: margens esquerda/superior 3cm, direita/inferior 2cm (1cm = 360000 EMU = 566,93 twips) —
// mesma formatação usada em docxIntervencaoBuilder.ts.
const MARGEM_ESQUERDA_EMU = 1080000;
const MARGEM_DIREITA_EMU = 720000;
const MARGEM_SUPERIOR_TWIPS = 1701;
const MARGEM_INFERIOR_TWIPS = 1134;
const MARGEM_ESQUERDA_TWIPS = 1701;
const MARGEM_DIREITA_TWIPS = 1134;

function extensaoPorMime(mime: string): string {
  return mime === "image/png" ? "png" : "jpeg";
}

function paragrafo(
  texto: string,
  opcoes: { negrito?: boolean; tamanho?: number; centralizado?: boolean } = {},
): string {
  const { negrito, tamanho, centralizado } = opcoes;
  const rPr = [negrito ? "<w:b/>" : "", tamanho ? `<w:sz w:val="${tamanho}"/><w:szCs w:val="${tamanho}"/>` : ""].join("");
  const pPr = centralizado ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : "";
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

function tituloSecao(texto: string): string {
  return `<w:p><w:pPr><w:spacing w:before="240"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(texto)}</w:t></w:r></w:p>`;
}

function montarCorpoDocumento(conteudo: ConteudoRelatorioFinal): string {
  const partes: string[] = [];

  partes.push(paragrafo("RELATÓRIO FINAL", { negrito: true, tamanho: 32, centralizado: true }));
  partes.push(paragrafo(" "));

  partes.push(paragrafoItem("Criança", conteudo.nomeCrianca));
  partes.push(paragrafoItem("Data de nascimento", conteudo.dataNascimento));
  partes.push(paragrafoItem("Escola", conteudo.escola));
  partes.push(paragrafoItem("Data", new Date(conteudo.geradoEm).toLocaleDateString("pt-BR")));
  partes.push(paragrafoItem("Profissional", `${conteudo.nomeProfissional} — ${conteudo.tituloProfissional}`));

  partes.push(tituloSecao("Objetivo alcançado"));
  partes.push(paragrafo(conteudo.objetivoAlcancado));

  partes.push(tituloSecao("Avaliação"));
  partes.push(paragrafoItem("Atenção", conteudo.avaliacaoAtencao));
  partes.push(paragrafoItem("Motivação", conteudo.avaliacaoMotivacao));
  partes.push(paragrafoItem("Interação", conteudo.avaliacaoInteracao));

  partes.push(tituloSecao("Relatório"));
  partes.push(paragrafo(conteudo.relatorioGerado));

  if (conteudo.observacoesFinais.trim()) {
    partes.push(tituloSecao("Observações finais"));
    partes.push(paragrafo(conteudo.observacoesFinais));
  }

  partes.push(paragrafo(" "));
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo(`Assinatura ${conteudo.tituloProfissional}`, { centralizado: true }));

  return partes.join("");
}

function montarDocumentXml(conteudo: ConteudoRelatorioFinal): string {
  const corpo = montarCorpoDocumento(conteudo);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NAMESPACES_WORDML}><w:body>${corpo}
<w:sectPr>
<w:headerReference w:type="default" r:id="rId2"/>
<w:footerReference w:type="default" r:id="rId3"/>
<w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="${MARGEM_SUPERIOR_TWIPS}" w:right="${MARGEM_DIREITA_TWIPS}" w:bottom="${MARGEM_INFERIOR_TWIPS}" w:left="${MARGEM_ESQUERDA_TWIPS}" w:header="426" w:footer="708" w:gutter="0"/>
<w:cols w:space="708"/>
</w:sectPr>
</w:body></w:document>`;
}

function xmlLogoCentralizado(identidade: IdentidadeVisualConfig): string {
  if (!identidade.logoBase64 || !identidade.logoMime) return "";

  const dimensoes = lerDimensoesImagem(identidade.logoBase64, identidade.logoMime);
  const larguraLogoEmu = Math.round(ALTURA_LOGO_EMU * (dimensoes.larguraPx / dimensoes.alturaPx));
  const larguraConteudoEmu = PAGINA_LARGURA_EMU - MARGEM_ESQUERDA_EMU - MARGEM_DIREITA_EMU;
  const offsetXEmu = Math.max(0, Math.round((larguraConteudoEmu - larguraLogoEmu) / 2));

  return xmlImagemAncorada({
    relationId: "rId1",
    nome: "Logo do relatório",
    larguraEmu: larguraLogoEmu,
    alturaEmu: ALTURA_LOGO_EMU,
    offsetXEmu,
    offsetYEmu: 40000,
  });
}

function xmlBordaCabecalho(identidade: IdentidadeVisualConfig): string {
  if (identidade.bordaBase64 && identidade.bordaMime) {
    const rId = identidade.logoBase64 ? "rId2" : "rId1";
    const roxa = xmlImagemAncorada({
      relationId: rId,
      nome: "Borda (canto superior direito)",
      larguraEmu: BORDA_ROXA.cabecalho.larguraEmu,
      alturaEmu: BORDA_ROXA.cabecalho.alturaEmu,
      offsetXEmu: BORDA_ROXA.cabecalho.xEmu,
      offsetYEmu: BORDA_ROXA.cabecalho.yEmu,
      relativeFrom: "page",
    });
    const verde = xmlImagemAncorada({
      relationId: rId,
      nome: "Borda (canto superior esquerdo)",
      larguraEmu: BORDA_VERDE.cabecalho.larguraEmu,
      alturaEmu: BORDA_VERDE.cabecalho.alturaEmu,
      offsetXEmu: BORDA_VERDE.cabecalho.xEmu,
      offsetYEmu: BORDA_VERDE.cabecalho.yEmu,
      relativeFrom: "page",
    });
    return verde + roxa;
  }

  return xmlFormaDecorativa(BORDA_VERDE, "cabecalho") + xmlFormaDecorativa(BORDA_ROXA, "cabecalho");
}

function xmlBordaRodape(identidade: IdentidadeVisualConfig): string {
  if (identidade.bordaBase64 && identidade.bordaMime) {
    const roxa = xmlImagemAncorada({
      relationId: "rId1",
      nome: "Borda (canto inferior esquerdo)",
      larguraEmu: BORDA_ROXA.rodape.larguraEmu,
      alturaEmu: BORDA_ROXA.rodape.alturaEmu,
      offsetXEmu: BORDA_ROXA.rodape.xEmu,
      offsetYEmu: BORDA_ROXA.rodape.yEmu,
      relativeFrom: "page",
    });
    const verde = xmlImagemAncorada({
      relationId: "rId1",
      nome: "Borda (canto inferior direito)",
      larguraEmu: BORDA_VERDE.rodape.larguraEmu,
      alturaEmu: BORDA_VERDE.rodape.alturaEmu,
      offsetXEmu: BORDA_VERDE.rodape.xEmu,
      offsetYEmu: BORDA_VERDE.rodape.yEmu,
      relativeFrom: "page",
    });
    return verde + roxa;
  }

  return xmlFormaDecorativa(BORDA_VERDE, "rodape") + xmlFormaDecorativa(BORDA_ROXA, "rodape");
}

function montarHeaderXml(conteudo: ConteudoRelatorioFinal, identidade: IdentidadeVisualConfig): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr ${NAMESPACES_WORDML} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
${xmlBordaCabecalho(identidade)}
${xmlLogoCentralizado(identidade)}
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(
    conteudo.tituloProfissional.toUpperCase(),
  )}</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(
    conteudo.nomeProfissional,
  )}</w:t></w:r></w:p>
</w:hdr>`;
}

function xmlCampoPagina(): string {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>
<w:r><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:t>1</w:t></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r>
</w:p>`;
}

function montarFooterXml(identidade: IdentidadeVisualConfig): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${NAMESPACES_WORDML} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
${xmlBordaRodape(identidade)}
${xmlCampoPagina()}
</w:ftr>`;
}

// ABNT: Times New Roman 12pt, espaçamento 1,5, parágrafo justificado por padrão — igual à
// Sugestão de Intervenção (docxIntervencaoBuilder.ts).
function montarStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:line="360" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr></w:pPrDefault>
</w:docDefaults>
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

function relacionamento(id: string, arquivo: string): string {
  return `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${arquivo}"/>`;
}

export async function gerarDocxRelatorioFinal(
  conteudo: ConteudoRelatorioFinal,
  identidade: IdentidadeVisualConfig,
): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file("[Content_Types].xml", montarContentTypesXml());
  zip.folder("_rels")?.file(".rels", montarRelsRaiz());

  const pastaWord = zip.folder("word");
  pastaWord?.file("document.xml", montarDocumentXml(conteudo));
  pastaWord?.file("styles.xml", montarStylesXml());
  pastaWord?.file("header1.xml", montarHeaderXml(conteudo, identidade));
  pastaWord?.file("footer1.xml", montarFooterXml(identidade));
  pastaWord?.folder("_rels")?.file("document.xml.rels", montarDocumentRels());

  const pastaMedia = pastaWord?.folder("media");
  const relacionamentosHeader: string[] = [];

  if (identidade.logoBase64 && identidade.logoMime) {
    const arquivo = `logo.${extensaoPorMime(identidade.logoMime)}`;
    pastaMedia?.file(arquivo, identidade.logoBase64, { base64: true });
    relacionamentosHeader.push(relacionamento("rId1", arquivo));
  }

  if (identidade.bordaBase64 && identidade.bordaMime) {
    const arquivo = `borda.${extensaoPorMime(identidade.bordaMime)}`;
    pastaMedia?.file(arquivo, identidade.bordaBase64, { base64: true });
    relacionamentosHeader.push(relacionamento(identidade.logoBase64 ? "rId2" : "rId1", arquivo));

    pastaWord
      ?.folder("_rels")
      ?.file(
        "footer1.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relacionamento(
          "rId1",
          arquivo,
        )}</Relationships>`,
      );
  }

  if (relacionamentosHeader.length > 0) {
    pastaWord
      ?.folder("_rels")
      ?.file(
        "header1.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relacionamentosHeader.join("")}</Relationships>`,
      );
  }

  return zip.generateAsync({ type: "uint8array" });
}
