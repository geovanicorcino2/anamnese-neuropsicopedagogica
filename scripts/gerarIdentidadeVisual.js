// Gera src/main/assets/identidadeVisual.ts a partir dos logos reais em
// assets/identidade-visual/ e das medidas/paths extraídos do documento original
// (ver anamnese_identidade_visual.md na memória do projeto). Rode de novo sempre que
// os arquivos de logo mudarem. NÃO editar identidadeVisual.ts à mão.
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const PASTA_LOGOS = path.join(RAIZ, "assets", "identidade-visual");
const SAIDA = path.join(RAIZ, "src", "main", "assets", "identidadeVisual.ts");

// EMU (English Metric Units): 914400 por polegada. Página A4 (11906 x 16838 twips,
// confirmado no sectPr do docx original) = 7560310 x 10692130 EMU.
const EMU_POR_POLEGADA = 914400;

function paraBase64(nomeArquivo) {
  const bytes = fs.readFileSync(path.join(PASTA_LOGOS, nomeArquivo));
  return bytes.toString("base64");
}

const logoHumanaBase64 = paraBase64("logo-humana-clinica.png");
const logoAnaPaulaBase64 = paraBase64("logo-ana-paula-neuropsicopedagoga.jpeg");

const conteudo = `// GERADO por scripts/gerarIdentidadeVisual.js — não editar à mão.
// Fonte: assets/identidade-visual/*.png|jpeg + anamnese_identidade_visual.md (memória do projeto).

export const EMU_POR_POLEGADA = ${EMU_POR_POLEGADA};

export function emuParaPolegadas(emu: number): number {
  return emu / EMU_POR_POLEGADA;
}

// --- Logos (raster, ficam no cabeçalho) ---------------------------------------------

export const LOGO_HUMANA_PNG_BASE64 =
  "${logoHumanaBase64}";
export const LOGO_HUMANA_LARGURA_EMU = 871869;
export const LOGO_HUMANA_ALTURA_EMU = 914400;
// Posição no cabeçalho original: 4890769 EMU da coluna, 11430 EMU do topo do parágrafo.
export const LOGO_HUMANA_OFFSET_X_EMU = 4890769;
export const LOGO_HUMANA_OFFSET_Y_EMU = 11430;

export const LOGO_ANAPAULA_JPEG_BASE64 =
  "${logoAnaPaulaBase64}";
export const LOGO_ANAPAULA_LARGURA_EMU = 1142446;
export const LOGO_ANAPAULA_ALTURA_EMU = 914400;
// Posição no cabeçalho original: 52070 EMU da coluna, 95250 EMU do topo do parágrafo.
export const LOGO_ANAPAULA_OFFSET_X_EMU = 52070;
export const LOGO_ANAPAULA_OFFSET_Y_EMU = 95250;

// --- Formas decorativas de canto (vetor, custGeom no docx original) ------------------
// Path em unidades EMU (coincide com o viewBox — usar direto como atributo "d" de <path>
// SVG, ou como <a:custGeom><a:pathLst><a:path> no DOCX).

export interface FormaDecorativa {
  path: string;
  viewBoxLargura: number;
  viewBoxAltura: number;
  corHex: string;
  alpha: number;
  cabecalho: { xEmu: number; yEmu: number; larguraEmu: number; alturaEmu: number; flipH: boolean; flipV: boolean };
  rodape: { xEmu: number; yEmu: number; larguraEmu: number; alturaEmu: number; flipH: boolean; flipV: boolean };
}

// Canto superior-direito (cabeçalho) e inferior-esquerdo (rodapé, espelhada).
export const BORDA_ROXA: FormaDecorativa = {
  path:
    "M351878,0 L0,0 L0,1382876 L1337,1430850 L5304,1478121 L11827,1524619 L20835,1570272 L32258,1615009 " +
    "L46024,1658758 L62062,1701448 L80299,1743008 L100666,1783367 L123089,1822452 L147500,1860193 " +
    "L173824,1896518 L201993,1931356 L231933,1964636 L263574,1996286 L296845,2026234 L331674,2054410 " +
    "L351878,2069060 L351878,0 Z",
  viewBoxLargura: 352425,
  viewBoxAltura: 2069464,
  corHex: "#BF91C2",
  alpha: 1,
  cabecalho: { xEmu: 6703695, yEmu: 450215, larguraEmu: 352425, alturaEmu: 2069464, flipH: false, flipV: false },
  rodape: { xEmu: 548640, yEmu: 8242935, larguraEmu: 352425, alturaEmu: 2069464, flipH: true, flipV: true },
};

// Canto superior-esquerdo (cabeçalho) e inferior-direito (rodapé, rotacionada 180°).
// A posição do rodapé é aproximada por simetria com o cabeçalho (mesma distância de
// 245110 EMU à borda mais próxima, mas espelhada — a partir da direita/baixo em vez de
// esquerda/cima), convertida aqui para coordenadas absolutas top-left-relative-à-página
// (que é o que tanto o DOCX quanto o CSS do PDF esperam). A posição exata no docx usa
// relativeFrom="leftMargin" combinado com rotação, cuja matemática de layout do Word não
// vale a pena reproduzir em pixel perfeito para um acento decorativo de canto.
export const BORDA_VERDE: FormaDecorativa = {
  path:
    "M566268,0 L135393,0 L135393,1362838 L132605,1411169 L124450,1457862 L111238,1502605 L93281,1545089 " +
    "L70889,1585001 L44374,1622033 L14045,1655872 L0,1668467 L0,2249368 L50071,2230213 L92777,2210721 " +
    "L134172,2188967 L174178,2165030 L212715,2138989 L249704,2110924 L285065,2080914 L318719,2049038 " +
    "L350587,2015375 L380590,1980005 L408648,1943006 L434682,1904459 L458613,1864443 L480362,1823036 " +
    "L499849,1780318 L516994,1736368 L531720,1691267 L543946,1645092 L553593,1597923 L560581,1549839 " +
    "L564833,1500920 L566268,1451245 L566268,0 Z",
  viewBoxLargura: 566420,
  viewBoxAltura: 2249805,
  corHex: "#00A650",
  alpha: 0.5,
  cabecalho: { xEmu: 245110, yEmu: 396240, larguraEmu: 655320, alturaEmu: 2423160, flipH: false, flipV: false },
  rodape: { xEmu: 6659880, yEmu: 7872730, larguraEmu: 655320, alturaEmu: 2423160, flipH: true, flipV: true },
};

// --- Página (A4, medidas do sectPr do docx original) ---------------------------------

export const PAGINA_LARGURA_EMU = 7560310;
export const PAGINA_ALTURA_EMU = 10692130;
export const MARGEM_ESQUERDA_EMU = 900430;
export const MARGEM_DIREITA_EMU = 809000;
export const MARGEM_SUPERIOR_EMU = 899795;
export const MARGEM_INFERIOR_EMU = 360045;
`;

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, conteudo, "utf8");

console.log(`Gerado: ${path.relative(RAIZ, SAIDA)}`);
console.log(`  logo-humana-clinica.png: ${Math.round(logoHumanaBase64.length / 1024)} KB em base64`);
console.log(`  logo-ana-paula-neuropsicopedagoga.jpeg: ${Math.round(logoAnaPaulaBase64.length / 1024)} KB em base64`);
