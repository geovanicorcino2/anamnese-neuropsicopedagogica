import type { ConteudoFicha } from "@core/services/anamneseContent";
import { resumirSecoesAnamnese } from "@core/services/anamneseContent";

export interface EntradaParaPrompt {
  tempoSessao: string | null;
  atividades: string;
}

// Gera Objetivo + Materiais de UMA sessão de Planejamento de Intervenção (histórico — uma linha
// por atendimento, ver planejamentosRepository.ts). Nome do arquivo mantido por continuidade com
// o resto do builder/exportação, mesmo o conceito de "Sugestões" ter virado "Planejamento".
export function montarPromptSugestoes(conteudo: ConteudoFicha, entrada: EntradaParaPrompt): string {
  const secoesTexto = resumirSecoesAnamnese(conteudo.secoes);

  return `Você é um assistente de apoio para um(a) neuropsicopedagogo(a). Abaixo está a anamnese
preenchida de uma criança e informações sobre a sessão de intervenção planejada. Com base nisso,
gere o objetivo da intervenção e os materiais necessários.

Regras importantes:
- Isso é uma SUGESTÃO inicial para revisão do profissional responsável, não um diagnóstico nem
  uma decisão clínica — deixe isso claro na resposta.
- Baseie-se apenas nas informações fornecidas abaixo. Não invente dados que não estão na ficha.
- Escreva em texto simples, SEM formatação markdown: não use **negrito**, não use "#" pra
  cabeçalhos, não use "---" como divisor, não use listas com "-" ou "*". Este texto vai direto
  para um documento Word/PDF que não interpreta markdown — os símbolos apareceriam literalmente.
- Responda em EXATAMENTE duas seções, cada uma iniciada por um marcador em linha própria, nesta
  ordem e sem nenhum texto antes do primeiro marcador:

### OBJETIVO
(texto do objetivo da intervenção, objetivo e prático)

### MATERIAIS
(lista dos materiais necessários para a sessão)

Criança: ${conteudo.nomeCrianca}

${secoesTexto}

## Sessão de intervenção planejada
- Tempo de sessão: ${entrada.tempoSessao ?? "não informado"}
- Atividades: ${entrada.atividades}
`;
}

export interface RespostaSugestoes {
  objetivo: string;
  materiais: string;
}

// Se a IA não seguir o formato pedido (### OBJETIVO / ### MATERIAIS), nada se perde — o texto
// inteiro cai em Objetivo e Materiais fica vazio, editável manualmente pelo profissional.
export function interpretarRespostaSugestoes(textoIa: string): RespostaSugestoes {
  const indiceObjetivo = textoIa.search(/###\s*OBJETIVO/i);
  const indiceMateriais = textoIa.search(/###\s*MATERIAIS/i);

  if (indiceObjetivo === -1 || indiceMateriais === -1 || indiceMateriais <= indiceObjetivo) {
    return { objetivo: textoIa.trim(), materiais: "" };
  }

  const objetivo = textoIa
    .slice(indiceObjetivo, indiceMateriais)
    .replace(/###\s*OBJETIVO/i, "")
    .trim();
  const materiais = textoIa
    .slice(indiceMateriais)
    .replace(/###\s*MATERIAIS/i, "")
    .trim();

  return { objetivo, materiais };
}
