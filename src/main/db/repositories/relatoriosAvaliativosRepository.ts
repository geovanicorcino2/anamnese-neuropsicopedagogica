import type { RelatorioAvaliativo } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId, runUpdate } from "@main/db/repositories/helpers";
import { touchFicha } from "@main/db/repositories/fichasRepository";

export function listRelatoriosAvaliativos(idFicha: string): RelatorioAvaliativo[] {
  return todos<RelatorioAvaliativo>(
    "SELECT * FROM RelatoriosAvaliativos WHERE ID_Ficha = ? ORDER BY Criado_Em DESC",
    [idFicha],
  );
}

export function getRelatorioAvaliativo(id: string): RelatorioAvaliativo | undefined {
  return primeiro<RelatorioAvaliativo>("SELECT * FROM RelatoriosAvaliativos WHERE ID_Relatorio = ?", [id]);
}

export function createRelatorioAvaliativo(
  idFicha: string,
  serie: string | null,
  dataInicioAvaliacao: string | null,
): RelatorioAvaliativo {
  const id = generateId("relatorio_avaliativo");
  const agora = agoraIso();
  executar(
    `INSERT INTO RelatoriosAvaliativos (ID_Relatorio, ID_Ficha, Serie, Data_Inicio_Avaliacao, Criado_Em) VALUES (?, ?, ?, ?, ?)`,
    [id, idFicha, serie, dataInicioAvaliacao, agora],
  );
  touchFicha(idFicha);
  return getRelatorioAvaliativo(id) as RelatorioAvaliativo;
}

export interface PatchRelatorioAvaliativo {
  serie?: string | null;
  dataInicioAvaliacao?: string | null;
  dataEncerramento?: string | null;
  objetivoAvaliacao?: string | null;
  historicoEscolarFamiliar?: string | null;
  aspectosEmocionaisComportamentais?: string | null;
  metodologiaAvaliacao?: string | null;
  aspectosCognitivosAprendizagem?: string | null;
  instrumentosUtilizados?: string | null;
  resultadosAvaliacao?: string | null;
  intervencoesAplicadas?: string | null;
  recomendacoes?: string | null;
  geradoEm?: string | null;
}

const COLUNA_POR_CAMPO: Record<keyof PatchRelatorioAvaliativo, string> = {
  serie: "Serie",
  dataInicioAvaliacao: "Data_Inicio_Avaliacao",
  dataEncerramento: "Data_Encerramento",
  objetivoAvaliacao: "Objetivo_Avaliacao",
  historicoEscolarFamiliar: "Historico_Escolar_Familiar",
  aspectosEmocionaisComportamentais: "Aspectos_Emocionais_Comportamentais",
  metodologiaAvaliacao: "Metodologia_Avaliacao",
  aspectosCognitivosAprendizagem: "Aspectos_Cognitivos_Aprendizagem",
  instrumentosUtilizados: "Instrumentos_Utilizados",
  resultadosAvaliacao: "Resultados_Avaliacao",
  intervencoesAplicadas: "Intervencoes_Aplicadas",
  recomendacoes: "Recomendacoes",
  geradoEm: "Gerado_Em",
};

export function updateRelatorioAvaliativo(
  id: string,
  idFicha: string,
  patch: PatchRelatorioAvaliativo,
): RelatorioAvaliativo {
  const patchColunas: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(patch)) {
    patchColunas[COLUNA_POR_CAMPO[campo as keyof PatchRelatorioAvaliativo]] = valor;
  }
  runUpdate("RelatoriosAvaliativos", "ID_Relatorio", id, patchColunas);
  touchFicha(idFicha);
  return getRelatorioAvaliativo(id) as RelatorioAvaliativo;
}

export function deleteRelatorioAvaliativo(id: string, idFicha: string): void {
  executar("DELETE FROM RelatoriosAvaliativos WHERE ID_Relatorio = ?", [id]);
  touchFicha(idFicha);
}
