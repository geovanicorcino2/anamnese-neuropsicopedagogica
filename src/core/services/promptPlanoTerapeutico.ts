import type { ConteudoFicha } from "@core/services/anamneseContent";
import { resumirSecoesAnamnese } from "@core/services/anamneseContent";
import { interpretarRespostaPorSecoes } from "@core/services/respostaIaPorSecoes";

export const MARCADORES_PLANO_TERAPEUTICO = [
  "DIAGNOSTICO",
  "ANAMNESE",
  "PROTOCOLOS",
  "CAPACIDADES",
  "NECESSIDADES",
  "METAS",
  "RECURSOS",
  "TREINAMENTO_PARENTAL",
  "PROFISSIONAIS",
  "FREQUENCIA",
] as const;

export function montarPromptPlanoTerapeutico(
  conteudo: ConteudoFicha,
  planoAnterior: string | null,
): string {
  const secoesTexto = resumirSecoesAnamnese(conteudo.secoes);
  const blocoAnterior = planoAnterior
    ? `\n## Plano Terapêutico anterior (para dar continuidade — este é um reavaliação semestral)\n${planoAnterior}\n`
    : "";

  return `Você é um assistente de apoio para um(a) neuropsicopedagogo(a). Abaixo está a anamnese
preenchida de uma criança. Com base nisso, redija um rascunho de Plano Terapêutico
Psicopedagógico (documento usado para convênio de saúde, refeito a cada ~6 meses).

Regras importantes:
- Isso é um RASCUNHO inicial para revisão do profissional responsável, não um diagnóstico nem uma
  decisão clínica definitiva — o profissional vai revisar e editar cada seção antes de usar.
- Baseie-se apenas nas informações fornecidas abaixo. Não invente dados que não estão na ficha.
- Escreva em texto simples, SEM formatação markdown: não use **negrito**, não use "#" pra
  cabeçalhos soltos, não use "---" como divisor, não use listas com "-" ou "*" (pode usar "•" se
  precisar mesmo de uma lista, sem o traço). Este texto vai direto para um documento Word/PDF que
  não interpreta markdown.
- Responda em EXATAMENTE 10 seções, cada uma iniciada por um marcador em linha própria, nesta
  ordem e sem nenhum texto antes do primeiro marcador:

### DIAGNOSTICO
(diagnóstico/quadro clínico do paciente, com CID se aplicável e mencionado na anamnese)

### ANAMNESE
(resumo em texto corrido da anamnese — desenvolvimento, comportamento, dificuldades relatadas)

### PROTOCOLOS
(lista dos protocolos/instrumentos de avaliação utilizados)

### CAPACIDADES
(capacidades e interesses da criança — o que sabe fazer, do que gosta)

### NECESSIDADES
(o que precisa ser trabalhado/ensinado — pode ser uma lista de tópicos)

### METAS
(metas terapêuticas e prazo estimado)

### RECURSOS
(recursos e estratégias a usar nas sessões)

### TREINAMENTO_PARENTAL
(orientações dadas à família)

### PROFISSIONAIS
(quais profissionais acompanham o caso, além do neuropsicopedagogo)

### FREQUENCIA
(frequência e duração dos atendimentos)
${blocoAnterior}
Criança: ${conteudo.nomeCrianca}

${secoesTexto}
`;
}

export interface RespostaPlanoTerapeutico {
  diagnostico: string;
  anamneseResumo: string;
  protocolosAvaliacao: string;
  capacidadesInteresses: string;
  necessidades: string;
  metasPrazos: string;
  recursosEstrategias: string;
  treinamentoParental: string;
  profissionaisAcompanham: string;
  frequenciaAtendimentos: string;
}

export function interpretarRespostaPlanoTerapeutico(textoIa: string): RespostaPlanoTerapeutico {
  const secoes = interpretarRespostaPorSecoes(textoIa, [...MARCADORES_PLANO_TERAPEUTICO]);
  return {
    diagnostico: secoes.DIAGNOSTICO,
    anamneseResumo: secoes.ANAMNESE,
    protocolosAvaliacao: secoes.PROTOCOLOS,
    capacidadesInteresses: secoes.CAPACIDADES,
    necessidades: secoes.NECESSIDADES,
    metasPrazos: secoes.METAS,
    recursosEstrategias: secoes.RECURSOS,
    treinamentoParental: secoes.TREINAMENTO_PARENTAL,
    profissionaisAcompanham: secoes.PROFISSIONAIS,
    frequenciaAtendimentos: secoes.FREQUENCIA,
  };
}
