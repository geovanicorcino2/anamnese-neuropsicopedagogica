import type { ConteudoFicha } from "@core/services/anamneseContent";
import { resumirSecoesAnamnese } from "@core/services/anamneseContent";
import { interpretarRespostaPorSecoes } from "@core/services/respostaIaPorSecoes";

export const MARCADORES_RELATORIO_AVALIATIVO = [
  "OBJETIVO",
  "HISTORICO",
  "ASPECTOS_EMOCIONAIS",
  "METODOLOGIA",
  "ASPECTOS_COGNITIVOS",
  "INSTRUMENTOS",
  "RESULTADOS",
  "INTERVENCOES",
  "RECOMENDACOES",
] as const;

export function montarPromptRelatorioAvaliativo(
  conteudo: ConteudoFicha,
  resumoSessoes: string | null,
  relatorioAnterior: string | null,
): string {
  const secoesTexto = resumirSecoesAnamnese(conteudo.secoes);
  const blocoSessoes = resumoSessoes
    ? `\n## Histórico de sessões de intervenção realizadas\n${resumoSessoes}\n`
    : "";
  const blocoAnterior = relatorioAnterior
    ? `\n## Relatório Avaliativo anterior (para dar continuidade)\n${relatorioAnterior}\n`
    : "";

  return `Você é um assistente de apoio para um(a) neuropsicopedagogo(a). Abaixo está a anamnese de
uma criança e, quando disponível, o histórico de sessões de intervenção já realizadas. Com base
nisso, redija um rascunho de Relatório Avaliativo — relatório narrativo da evolução da criança ao
longo do acompanhamento neuropsicopedagógico.

Regras importantes:
- Isso é um RASCUNHO inicial para revisão do profissional responsável, não um diagnóstico nem uma
  decisão clínica definitiva — o profissional vai revisar e editar cada seção antes de usar.
- Baseie-se apenas nas informações fornecidas abaixo. Não invente dados que não estão na ficha.
- Escreva em texto simples, SEM formatação markdown: não use **negrito**, não use "#" pra
  cabeçalhos soltos, não use "---" como divisor, não use listas com "-" ou "*". Este texto vai
  direto para um documento Word/PDF que não interpreta markdown.
- Responda em EXATAMENTE 9 seções, cada uma iniciada por um marcador em linha própria, nesta
  ordem e sem nenhum texto antes do primeiro marcador:

### OBJETIVO
(objetivo deste relatório avaliativo, em texto corrido)

### HISTORICO
(histórico escolar e familiar relevante)

### ASPECTOS_EMOCIONAIS
(aspectos emocionais e comportamentais observados)

### METODOLOGIA
(metodologia usada na avaliação — observação clínica, instrumentos, período)

### ASPECTOS_COGNITIVOS
(aspectos cognitivos e de aprendizagem — atenção, memória, linguagem, coordenação motora etc.)

### INSTRUMENTOS
(lista dos instrumentos/protocolos utilizados na avaliação)

### RESULTADOS
(resultados e conclusões da avaliação)

### INTERVENCOES
(intervenções aplicadas ao longo do acompanhamento)

### RECOMENDACOES
(recomendações de continuidade/encaminhamento)
${blocoSessoes}${blocoAnterior}
Criança: ${conteudo.nomeCrianca}

${secoesTexto}
`;
}

export interface RespostaRelatorioAvaliativo {
  objetivoAvaliacao: string;
  historicoEscolarFamiliar: string;
  aspectosEmocionaisComportamentais: string;
  metodologiaAvaliacao: string;
  aspectosCognitivosAprendizagem: string;
  instrumentosUtilizados: string;
  resultadosAvaliacao: string;
  intervencoesAplicadas: string;
  recomendacoes: string;
}

export function interpretarRespostaRelatorioAvaliativo(textoIa: string): RespostaRelatorioAvaliativo {
  const secoes = interpretarRespostaPorSecoes(textoIa, [...MARCADORES_RELATORIO_AVALIATIVO]);
  return {
    objetivoAvaliacao: secoes.OBJETIVO,
    historicoEscolarFamiliar: secoes.HISTORICO,
    aspectosEmocionaisComportamentais: secoes.ASPECTOS_EMOCIONAIS,
    metodologiaAvaliacao: secoes.METODOLOGIA,
    aspectosCognitivosAprendizagem: secoes.ASPECTOS_COGNITIVOS,
    instrumentosUtilizados: secoes.INSTRUMENTOS,
    resultadosAvaliacao: secoes.RESULTADOS,
    intervencoesAplicadas: secoes.INTERVENCOES,
    recomendacoes: secoes.RECOMENDACOES,
  };
}
