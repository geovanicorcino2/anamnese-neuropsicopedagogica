import JSZip from "jszip";
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
} from "@main/assets/identidadeVisual";
import { base64Bytes, escaparXml, utf8Bytes, xmlFormaDecorativa, xmlImagemAncorada, xmlRunImagemAncorada } from "@main/export/docxXmlHelpers";
import { lerDimensoesImagem } from "@main/export/dimensoesImagem";

const NAMESPACES_WORDML =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

const ALTURA_LOGO_EMU = 900000;

function extensaoPorMime(mime: string): string {
  return mime === "image/png" ? "png" : "jpeg";
}

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

function tabelaFamiliares(familiares: ConteudoFicha["familiares"]): string {
  if (familiares.length === 0) {
    return paragrafo("Nenhum familiar cadastrado.");
  }

  // Larguras exatas do original (5535/1618/1923 twips).
  const celula = (texto: string, largura: number, cabecalho = false): string =>
    `<w:tc><w:tcPr><w:tcW w:w="${largura}" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/></w:tcBorders></w:tcPr><w:p>${
      cabecalho ? `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(texto)}</w:t></w:r>` : `<w:r><w:t xml:space="preserve">${escaparXml(texto)}</w:t></w:r>`
    }</w:p></w:tc>`;

  const linhaCabecalho = `<w:tr>${celula("Nome", 5535, true)}${celula("Idade", 1618, true)}${celula("Relação", 1923, true)}</w:tr>`;
  const linhas = familiares
    .map((f) => `<w:tr>${celula(f.nome, 5535)}${celula(f.idade, 1618)}${celula(f.relacao, 1923)}</w:tr>`)
    .join("");

  return `<w:tbl><w:tblPr><w:tblW w:w="9076" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:color="auto"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="5535"/><w:gridCol w:w="1618"/><w:gridCol w:w="1923"/></w:tblGrid>${linhaCabecalho}${linhas}</w:tbl>`;
}

// Grade 4x8 sem bordas (4 pares de coluna [checkbox, doença] × 5 linhas = 18 doenças), larguras e
// ordem exatas do original — a ordem bate 1:1 com campo.opcoes de historia_clinica.doencas.
function tabelaHistoriaClinica(respostas: Map<string, string>): string {
  const campo = encontrarCampo("historia_clinica.doencas");
  const doencas = campo?.opcoes ?? [];
  const larguras = [222, 3004, 222, 1497, 222, 2351, 222, 1244];

  const celulaCheckbox = (marcado: boolean, largura: number): string =>
    `<w:tc><w:tcPr><w:tcW w:w="${largura}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${marcado ? "X" : " "}</w:t></w:r></w:p></w:tc>`;
  const celulaTexto = (texto: string, largura: number): string =>
    `<w:tc><w:tcPr><w:tcW w:w="${largura}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${escaparXml(texto)}</w:t></w:r></w:p></w:tc>`;

  const linhas: string[] = [];
  for (let i = 0; i < doencas.length; i += 4) {
    const grupo = doencas.slice(i, i + 4);
    let colunas = "";
    for (let coluna = 0; coluna < 4; coluna++) {
      const doenca = grupo[coluna];
      const larguraCheckbox = larguras[coluna * 2];
      const larguraTexto = larguras[coluna * 2 + 1];
      if (doenca) {
        const marcado = opcaoEstaSelecionada("historia_clinica.doencas", doenca, respostas);
        colunas += celulaCheckbox(marcado, larguraCheckbox) + celulaTexto(doenca, larguraTexto);
      } else {
        colunas += celulaCheckbox(false, larguraCheckbox) + celulaTexto("", larguraTexto);
      }
    }
    linhas.push(`<w:tr>${colunas}</w:tr>`);
  }

  const gridCols = larguras.map((largura) => `<w:gridCol w:w="${largura}"/>`).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${linhas.join("")}</w:tbl>`;
}

// Uma <w:t> por trecho sem tab, com <w:tab/> real entre eles — texto com "\t" embutido (ver
// anamneseModeloOriginal.ts) vira tabulação de verdade no Word, igual ao documento original.
function xmlRunTexto(texto: string, negrito?: boolean): string {
  if (!texto) return "";
  const rPr = negrito ? "<w:rPr><w:b/></w:rPr>" : "";
  return texto
    .split("\t")
    .map((trecho, indice) => {
      const tab = indice > 0 ? "<w:tab/>" : "";
      if (!trecho && !tab) return "";
      return `<w:r>${rPr}${tab}<w:t xml:space="preserve">${escaparXml(trecho)}</w:t></w:r>`;
    })
    .join("");
}

function renderizarSegmentoDocx(
  segmento: SegmentoLinha,
  ficha: Ficha,
  respostas: Map<string, string>,
  negritoLinha: boolean | undefined,
): string {
  if (segmento.tipo === "texto") {
    return xmlRunTexto(segmento.texto, segmento.negrito || negritoLinha);
  }
  if (segmento.tipo === "campo") {
    return xmlRunTexto(resolverValorCampo(segmento.campoId, respostas), negritoLinha);
  }
  if (segmento.tipo === "campo_ficha") {
    return xmlRunTexto(resolverCampoFicha(segmento.campo, ficha), negritoLinha);
  }
  const marcado = opcaoEstaSelecionada(segmento.campoId, segmento.opcao, respostas);
  return xmlRunTexto(`(${marcado ? "X" : "  "}) ${segmento.rotulo}`, negritoLinha);
}

function paragrafoLinha(linhaModelo: LinhaModelo, ficha: Ficha, respostas: Map<string, string>): string {
  const runs = linhaModelo.segmentos
    .map((segmento) => renderizarSegmentoDocx(segmento, ficha, respostas, linhaModelo.negrito))
    .join("");
  return `<w:p>${runs}</w:p>`;
}

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataPorExtenso(data: Date): string {
  return `${data.getDate()} de ${MESES_PT[data.getMonth()]} de ${data.getFullYear()}`;
}

// Reproduz o texto corrido do documento-modelo (MODELO_ANAMNESE_ORIGINAL), não a grade
// "Rótulo: Valor" — ver anamneseModeloOriginal.ts pro porquê.
function montarCorpoDocumento(ficha: Ficha, conteudo: ConteudoFicha, respostas: Map<string, string>): string {
  const partes: string[] = [];

  for (const secaoSchema of ANAMNESE_SCHEMA) {
    const secaoModelo = MODELO_ANAMNESE_ORIGINAL.find((s) => s.secaoId === secaoSchema.id);
    partes.push(paragrafo(secaoSchema.titulo.toUpperCase(), { negrito: true }));

    if (secaoSchema.id === "historia_clinica") {
      partes.push(tabelaHistoriaClinica(respostas));
    }

    if (secaoModelo) {
      for (const linhaModelo of secaoModelo.linhas) {
        partes.push(paragrafoLinha(linhaModelo, ficha, respostas));
      }
    }

    if (secaoSchema.id === "composicao_familiar") {
      partes.push(tabelaFamiliares(conteudo.familiares));
    }

    partes.push(paragrafo(" "));
  }

  partes.push(paragrafo(`Santa Helena de Goiás, ${dataPorExtenso(new Date(conteudo.geradoEm))}.`));
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo("Assinatura Responsável", { centralizado: true }));
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo("Assinatura Responsável", { centralizado: true }));
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo(`Assinatura ${conteudo.tituloProfissional}`, { centralizado: true }));
  partes.push(paragrafo(" "));
  partes.push(paragrafo("___________________________________", { centralizado: true }));
  partes.push(paragrafo(`Assinatura ${conteudo.tituloProfissional}`, { centralizado: true }));

  return partes.join("");
}

function montarDocumentXml(ficha: Ficha, conteudo: ConteudoFicha, respostas: Map<string, string>): string {
  const corpo = montarCorpoDocumento(ficha, conteudo, respostas);
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

export interface ImagemLogoHeader {
  relationId: string;
  arquivo: string;
  base64: string;
  larguraEmu: number;
  alturaEmu: number;
  offsetXEmu: number;
  offsetYEmu: number;
  nome: string;
}

// Logo custom do Perfil (se configurada) OU, por padrão, as 2 logos originais do modelo
// (Humana Clínica de Saúde Integrada + Ana Paula M. Gontijo) — mesmo padrão de fallback já usado
// pra borda (BORDA_ROXA/BORDA_VERDE quando Borda_Base64 é null). Posições/tamanhos das 2 logos
// originais vêm direto do header1.xml do documento-modelo (ver anamnese_identidade_visual, memória
// do projeto).
function resolverImagensLogo(identidade: IdentidadeVisualConfig): ImagemLogoHeader[] {
  if (identidade.logoBase64 && identidade.logoMime) {
    const dimensoes = lerDimensoesImagem(identidade.logoBase64, identidade.logoMime);
    const larguraLogoEmu = Math.round(ALTURA_LOGO_EMU * (dimensoes.larguraPx / dimensoes.alturaPx));
    const larguraConteudoEmu = PAGINA_LARGURA_EMU - MARGEM_ESQUERDA_EMU - MARGEM_DIREITA_EMU;
    const offsetXEmu = Math.max(0, Math.round((larguraConteudoEmu - larguraLogoEmu) / 2));

    return [
      {
        relationId: "rId1",
        arquivo: `logo.${extensaoPorMime(identidade.logoMime)}`,
        base64: identidade.logoBase64,
        larguraEmu: larguraLogoEmu,
        alturaEmu: ALTURA_LOGO_EMU,
        offsetXEmu,
        offsetYEmu: 40000,
        nome: "Logo do relatório",
      },
    ];
  }

  return [
    {
      relationId: "rId1",
      arquivo: "logo-humana.png",
      base64: LOGO_HUMANA_PNG_BASE64,
      larguraEmu: LOGO_HUMANA_LARGURA_EMU,
      alturaEmu: LOGO_HUMANA_ALTURA_EMU,
      offsetXEmu: LOGO_HUMANA_OFFSET_X_EMU,
      offsetYEmu: LOGO_HUMANA_OFFSET_Y_EMU,
      nome: "Logo Humana Clínica de Saúde Integrada",
    },
    {
      relationId: "rId2",
      arquivo: "logo-anapaula.jpeg",
      base64: LOGO_ANAPAULA_JPEG_BASE64,
      larguraEmu: LOGO_ANAPAULA_LARGURA_EMU,
      alturaEmu: LOGO_ANAPAULA_ALTURA_EMU,
      offsetXEmu: LOGO_ANAPAULA_OFFSET_X_EMU,
      offsetYEmu: LOGO_ANAPAULA_OFFSET_Y_EMU,
      nome: "Logo Ana Paula M. Gontijo, Neuropsicopedagoga",
    },
  ];
}

// As logos têm posição relativeFrom="paragraph" (igual ao documento original) — por isso TODAS
// precisam estar no MESMO <w:p>: cada parágrafo novo desloca o "topo" de referência da próxima
// âncora, então 2 logos em parágrafos separados apareceriam uma abaixo da outra, fora do lugar.
function xmlLogosCabecalho(imagens: ImagemLogoHeader[]): string {
  const runs = imagens
    .map((imagem) =>
      xmlRunImagemAncorada({
        relationId: imagem.relationId,
        nome: imagem.nome,
        larguraEmu: imagem.larguraEmu,
        alturaEmu: imagem.alturaEmu,
        offsetXEmu: imagem.offsetXEmu,
        offsetYEmu: imagem.offsetYEmu,
      }),
    )
    .join("");
  return `<w:p>${runs}</w:p>`;
}

// As formas de borda usam relativeFrom="page" (posição absoluta na página), então não sofrem do
// problema de deslocamento por parágrafo — podem vir depois das logos sem risco.
function xmlBordaCabecalho(identidade: IdentidadeVisualConfig, proximoRId: string): string {
  if (identidade.bordaBase64 && identidade.bordaMime) {
    const roxa = xmlImagemAncorada({
      relationId: proximoRId,
      nome: "Borda (canto superior direito)",
      larguraEmu: BORDA_ROXA.cabecalho.larguraEmu,
      alturaEmu: BORDA_ROXA.cabecalho.alturaEmu,
      offsetXEmu: BORDA_ROXA.cabecalho.xEmu,
      offsetYEmu: BORDA_ROXA.cabecalho.yEmu,
      relativeFrom: "page",
    });
    const verde = xmlImagemAncorada({
      relationId: proximoRId,
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

function montarHeaderXml(conteudo: ConteudoFicha, identidade: IdentidadeVisualConfig, imagensLogo: ImagemLogoHeader[]): string {
  // Ordem igual ao original: logos primeiro (parágrafo 0), formas de borda depois — ver
  // xmlLogosCabecalho pra explicação do porquê a ordem importa aqui.
  const rIdBorda = `rId${imagensLogo.length + 1}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr ${NAMESPACES_WORDML} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
${xmlLogosCabecalho(imagensLogo)}
${xmlBordaCabecalho(identidade, rIdBorda)}
<w:p/>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(
    conteudo.tituloProfissional.toUpperCase(),
  )}</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escaparXml(
    conteudo.nomeProfissional,
  )}</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">_________________________________________________________________________</w:t></w:r></w:p>
</w:hdr>`;
}

function montarFooterXml(identidade: IdentidadeVisualConfig): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${NAMESPACES_WORDML} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
${xmlBordaRodape(identidade)}
</w:ftr>`;
}

// Fonte, tamanho e espaçamento de parágrafo iguais ao original (Arial 11pt, w:line="360" auto,
// sem espaço depois do parágrafo, justificado).
function montarStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr></w:pPrDefault>
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

export async function gerarDocxAnamnese(
  ficha: Ficha,
  conteudo: ConteudoFicha,
  respostas: Map<string, string>,
  identidade: IdentidadeVisualConfig,
): Promise<Uint8Array> {
  const zip = new JSZip();
  const imagensLogo = resolverImagensLogo(identidade);

  zip.file("[Content_Types].xml", utf8Bytes(montarContentTypesXml()));
  zip.folder("_rels")?.file(".rels", utf8Bytes(montarRelsRaiz()));

  const pastaWord = zip.folder("word");
  pastaWord?.file("document.xml", utf8Bytes(montarDocumentXml(ficha, conteudo, respostas)));
  pastaWord?.file("styles.xml", utf8Bytes(montarStylesXml()));
  pastaWord?.file("header1.xml", utf8Bytes(montarHeaderXml(conteudo, identidade, imagensLogo)));
  pastaWord?.file("footer1.xml", utf8Bytes(montarFooterXml(identidade)));
  pastaWord?.folder("_rels")?.file("document.xml.rels", utf8Bytes(montarDocumentRels()));

  const pastaMedia = pastaWord?.folder("media");
  const relacionamentosHeader: string[] = [];

  for (const imagem of imagensLogo) {
    pastaMedia?.file(imagem.arquivo, base64Bytes(imagem.base64));
    relacionamentosHeader.push(relacionamento(imagem.relationId, imagem.arquivo));
  }

  if (identidade.bordaBase64 && identidade.bordaMime) {
    const arquivo = `borda.${extensaoPorMime(identidade.bordaMime)}`;
    const rIdBorda = `rId${imagensLogo.length + 1}`;
    pastaMedia?.file(arquivo, base64Bytes(identidade.bordaBase64));
    relacionamentosHeader.push(relacionamento(rIdBorda, arquivo));

    pastaWord
      ?.folder("_rels")
      ?.file(
        "footer1.xml.rels",
        utf8Bytes(
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relacionamento(
            "rId1",
            arquivo,
          )}</Relationships>`,
        ),
      );
  }

  if (relacionamentosHeader.length > 0) {
    pastaWord
      ?.folder("_rels")
      ?.file(
        "header1.xml.rels",
        utf8Bytes(
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relacionamentosHeader.join("")}</Relationships>`,
        ),
      );
  }

  return zip.generateAsync({ type: "uint8array" });
}
