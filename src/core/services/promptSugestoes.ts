import type { ConteudoFicha } from "@core/services/anamneseContent";

export function montarPromptSugestoes(conteudo: ConteudoFicha): string {
  const secoesTexto = conteudo.secoes
    .map((secao) => {
      const itens = secao.itens.filter((item) => item.valor !== "—").map((item) => `- ${item.rotulo}: ${item.valor}`);
      if (itens.length === 0) return null;
      return `## ${secao.titulo}\n${itens.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `Você é um assistente de apoio para um(a) neuropsicopedagogo(a). Abaixo está a anamnese
preenchida de uma criança. Com base nessas respostas, sugira possíveis intervenções
neuropsicopedagógicas a serem consideradas pelo profissional.

Regras importantes:
- Isso é uma SUGESTÃO inicial para revisão do profissional responsável, não um diagnóstico nem
  uma decisão clínica — deixe isso claro na resposta.
- Baseie-se apenas nas informações fornecidas abaixo. Não invente dados que não estão na ficha.
- Organize a resposta por área (ex.: cognitiva, comportamental, escolar, familiar) quando fizer
  sentido, com sugestões objetivas e práticas.

Criança: ${conteudo.nomeCrianca}

${secoesTexto}
`;
}
