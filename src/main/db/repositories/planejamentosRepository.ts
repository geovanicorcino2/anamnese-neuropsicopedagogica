import type { PlanejamentoIntervencao } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId, runUpdate } from "@main/db/repositories/helpers";
import { touchFicha } from "@main/db/repositories/fichasRepository";

export function listPlanejamentos(idFicha: string): PlanejamentoIntervencao[] {
  return todos<PlanejamentoIntervencao>(
    "SELECT * FROM PlanejamentosIntervencao WHERE ID_Ficha = ? ORDER BY Data_Sessao DESC, Criado_Em DESC",
    [idFicha],
  );
}

export function getPlanejamento(id: string): PlanejamentoIntervencao | undefined {
  return primeiro<PlanejamentoIntervencao>("SELECT * FROM PlanejamentosIntervencao WHERE ID_Planejamento = ?", [id]);
}

export interface NovoPlanejamento {
  idFicha: string;
  dataSessao: string;
  serie: string | null;
  tempoSessao: string | null;
  atividades: string | null;
}

// Cria uma sessão nova (rascunho) — Objetivo_Gerado/Materiais_Gerado ficam vazios até a IA rodar
// (ver gerarPlanejamentoIntervencao.ts), avaliação pós-sessão fica vazia até o profissional
// preencher depois do atendimento.
export function createPlanejamento(dados: NovoPlanejamento): PlanejamentoIntervencao {
  const id = generateId("planejamento");
  const agora = agoraIso();
  executar(
    `INSERT INTO PlanejamentosIntervencao (ID_Planejamento, ID_Ficha, Data_Sessao, Serie, Tempo_Sessao, Atividades, Criado_Em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, dados.idFicha, dados.dataSessao, dados.serie, dados.tempoSessao, dados.atividades, agora],
  );
  touchFicha(dados.idFicha);
  return getPlanejamento(id) as PlanejamentoIntervencao;
}

export interface PatchPlanejamento {
  dataSessao?: string;
  serie?: string | null;
  tempoSessao?: string | null;
  atividades?: string | null;
  objetivoGerado?: string | null;
  materiaisGerado?: string | null;
  avaliacaoAtencao?: string | null;
  avaliacaoMotivacao?: string | null;
  avaliacaoInteracao?: string | null;
  objetivoSessao?: string | null;
  observacoes?: string | null;
  geradoEm?: string | null;
}

const COLUNA_POR_CAMPO: Record<keyof PatchPlanejamento, string> = {
  dataSessao: "Data_Sessao",
  serie: "Serie",
  tempoSessao: "Tempo_Sessao",
  atividades: "Atividades",
  objetivoGerado: "Objetivo_Gerado",
  materiaisGerado: "Materiais_Gerado",
  avaliacaoAtencao: "Avaliacao_Atencao",
  avaliacaoMotivacao: "Avaliacao_Motivacao",
  avaliacaoInteracao: "Avaliacao_Interacao",
  objetivoSessao: "Objetivo_Sessao",
  observacoes: "Observacoes",
  geradoEm: "Gerado_Em",
};

export function updatePlanejamento(id: string, idFicha: string, patch: PatchPlanejamento): PlanejamentoIntervencao {
  const patchColunas: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(patch)) {
    patchColunas[COLUNA_POR_CAMPO[campo as keyof PatchPlanejamento]] = valor;
  }
  runUpdate("PlanejamentosIntervencao", "ID_Planejamento", id, patchColunas);
  touchFicha(idFicha);
  return getPlanejamento(id) as PlanejamentoIntervencao;
}

export function deletePlanejamento(id: string, idFicha: string): void {
  executar("DELETE FROM PlanejamentosIntervencao WHERE ID_Planejamento = ?", [id]);
  touchFicha(idFicha);
}
