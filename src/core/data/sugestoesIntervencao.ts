export const TEMPOS_SESSAO = ["Até 20min", "20–40min", "Mais de 40min"] as const;

export type TempoSessao = (typeof TEMPOS_SESSAO)[number];
