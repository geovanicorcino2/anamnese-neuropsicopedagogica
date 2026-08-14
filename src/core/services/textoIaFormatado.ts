// Interpreta a formatação markdown "leve" que a IA às vezes usa mesmo quando o prompt pede texto
// simples (negrito **texto**, cabeçalhos "# texto", itens de lista "- texto", divisores "---").
// Sem isso, os asteriscos/marcadores apareciam literalmente no DOCX/PDF exportado — ver
// docxXmlHelpers.ts (paragrafoTextoIa) e os templates de PDF de Intervenção/Relatório Final pros
// consumidores. Pura/portável (sem XML/HTML aqui) — cada builder renderiza a estrutura no seu
// próprio formato, mesmo padrão de anamneseModeloResolver.ts.

export interface SpanFormatado {
  texto: string;
  negrito: boolean;
}

export interface LinhaFormatada {
  spans: SpanFormatado[];
}

const REGEX_DIVISOR = /^(-{3,}|\*{3,}|_{3,})$/;
const REGEX_CABECALHO = /^#{1,6}\s+(.*)$/;
const REGEX_ITEM_LISTA = /^[-*]\s+(.*)$/;
const REGEX_NEGRITO = /\*\*(.+?)\*\*/g;

function interpretarNegritoInline(texto: string): SpanFormatado[] {
  const spans: SpanFormatado[] = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  REGEX_NEGRITO.lastIndex = 0;
  while ((match = REGEX_NEGRITO.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      spans.push({ texto: texto.slice(ultimoIndice, match.index), negrito: false });
    }
    spans.push({ texto: match[1], negrito: true });
    ultimoIndice = match.index + match[0].length;
  }
  if (ultimoIndice < texto.length) {
    spans.push({ texto: texto.slice(ultimoIndice), negrito: false });
  }

  return spans.length > 0 ? spans : [{ texto, negrito: false }];
}

// Cada linha não-vazia do resultado vira um parágrafo próprio no builder consumidor — não
// concatenar linhas com quebra manual dentro de um único parágrafo justificado, isso estica o
// espaçamento entre letras/palavras de forma estranha (Word só evita esse estica-mento na ÚLTIMA
// linha de um parágrafo de verdade, não numa linha terminada por <w:br/>).
export function formatarTextoIa(textoBruto: string): LinhaFormatada[] {
  const linhas = textoBruto
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  const resultado: LinhaFormatada[] = [];

  for (const linha of linhas) {
    if (REGEX_DIVISOR.test(linha)) continue;

    const cabecalho = linha.match(REGEX_CABECALHO);
    if (cabecalho) {
      resultado.push({ spans: [{ texto: cabecalho[1], negrito: true }] });
      continue;
    }

    const item = linha.match(REGEX_ITEM_LISTA);
    if (item) {
      const spans = interpretarNegritoInline(item[1]);
      spans[0] = { ...spans[0], texto: `• ${spans[0].texto}` };
      resultado.push({ spans });
      continue;
    }

    resultado.push({ spans: interpretarNegritoInline(linha) });
  }

  return resultado;
}
