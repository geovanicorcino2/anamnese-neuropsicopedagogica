import type { ConteudoFicha } from "@core/services/anamneseContent";
import { resumirSecoesAnamnese } from "@core/services/anamneseContent";
import type { ConteudoIntervencao } from "@core/services/intervencaoContent";

export interface EntradaRelatorioFinalParaPrompt {
  objetivoAlcancado: string;
  avaliacaoAtencao: string;
  avaliacaoMotivacao: string;
  avaliacaoInteracao: string;
  observacoesFinais: string | null;
}

// Diferente do prompt de Sugestão de Intervenção (que pede duas seções marcadas), aqui a IA
// devolve um texto corrido único — a resposta inteira (trimmed) vira Relatorio_Gerado, sem
// parsing (ver gerarRelatorioFinal.ts).
export function montarPromptRelatorioFinal(
  conteudoAnamnese: ConteudoFicha,
  conteudoIntervencao: ConteudoIntervencao,
  entrada: EntradaRelatorioFinalParaPrompt,
): string {
  const secoesTexto = resumirSecoesAnamnese(conteudoAnamnese.secoes);

  return `Você é um assistente de apoio para um(a) neuropsicopedagogo(a). Abaixo estão a anamnese
preenchida de uma criança, a intervenção que foi planejada, e uma avaliação de como o
acompanhamento se desenvolveu. Com base nisso, escreva o texto de um relatório final de
acompanhamento.

Regras importantes:
- Isso é uma SUGESTÃO de texto para revisão do profissional responsável, não um diagnóstico nem
  uma decisão clínica — deixe isso claro na resposta.
- Baseie-se apenas nas informações fornecidas abaixo. Não invente dados que não estão na ficha.
- Responda em texto corrido (sem marcadores de seção, sem listas), num tom técnico e objetivo
  adequado a um relatório profissional, sintetizando a evolução da criança ao longo do
  acompanhamento com base no objetivo alcançado e na avaliação de atenção/motivação/interação.

Criança: ${conteudoAnamnese.nomeCrianca}

${secoesTexto}

## Intervenção planejada
- Tempo de sessão: ${conteudoIntervencao.tempoSessao}
- Atividades: ${conteudoIntervencao.atividades}
- Objetivo da intervenção: ${conteudoIntervencao.objetivo}
- Materiais: ${conteudoIntervencao.materiais}

## Avaliação do acompanhamento
- Objetivo alcançado: ${entrada.objetivoAlcancado}
- Avaliação de atenção: ${entrada.avaliacaoAtencao}
- Avaliação de motivação: ${entrada.avaliacaoMotivacao}
- Avaliação de interação: ${entrada.avaliacaoInteracao}
- Observações finais do profissional: ${entrada.observacoesFinais ?? "nenhuma"}
`;
}
