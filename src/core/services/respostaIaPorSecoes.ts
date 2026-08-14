// Parser genérico de respostas de IA em múltiplas seções marcadas ("### NOME_SECAO"), usado por
// Plano Terapêutico e Relatório Avaliativo (mais seções que o par OBJETIVO/MATERIAIS de
// promptSugestoes.ts, que tem seu próprio parser mais simples). Marcador não encontrado vira
// string vazia — nada trava, o profissional preenche à mão (mesma filosofia de fallback já usada
// em interpretarRespostaSugestoes).
export function interpretarRespostaPorSecoes(textoIa: string, marcadores: string[]): Record<string, string> {
  const posicoes = marcadores.map((marcador) => ({
    marcador,
    indice: textoIa.search(new RegExp(`###\\s*${marcador}\\b`, "i")),
  }));

  const resultado: Record<string, string> = {};
  for (let i = 0; i < posicoes.length; i++) {
    const atual = posicoes[i];
    if (atual.indice === -1) {
      resultado[atual.marcador] = "";
      continue;
    }
    const proximoValido = posicoes.slice(i + 1).find((p) => p.indice !== -1);
    const fim = proximoValido ? proximoValido.indice : textoIa.length;
    resultado[atual.marcador] = textoIa
      .slice(atual.indice, fim)
      .replace(new RegExp(`###\\s*${atual.marcador}\\b`, "i"), "")
      .trim();
  }
  return resultado;
}
