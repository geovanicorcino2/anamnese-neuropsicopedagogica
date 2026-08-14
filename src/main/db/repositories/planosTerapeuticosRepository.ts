import type { PlanoTerapeutico } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId, runUpdate } from "@main/db/repositories/helpers";
import { touchFicha } from "@main/db/repositories/fichasRepository";

export function listPlanosTerapeuticos(idFicha: string): PlanoTerapeutico[] {
  return todos<PlanoTerapeutico>(
    "SELECT * FROM PlanosTerapeuticos WHERE ID_Ficha = ? ORDER BY Data_Planejamento DESC, Criado_Em DESC",
    [idFicha],
  );
}

export function getPlanoTerapeutico(id: string): PlanoTerapeutico | undefined {
  return primeiro<PlanoTerapeutico>("SELECT * FROM PlanosTerapeuticos WHERE ID_Plano = ?", [id]);
}

export function createPlanoTerapeutico(idFicha: string, dataPlanejamento: string): PlanoTerapeutico {
  const id = generateId("plano");
  const agora = agoraIso();
  executar(
    `INSERT INTO PlanosTerapeuticos (ID_Plano, ID_Ficha, Data_Planejamento, Criado_Em) VALUES (?, ?, ?, ?)`,
    [id, idFicha, dataPlanejamento, agora],
  );
  touchFicha(idFicha);
  return getPlanoTerapeutico(id) as PlanoTerapeutico;
}

export interface PatchPlanoTerapeutico {
  diagnostico?: string | null;
  anamneseResumo?: string | null;
  protocolosAvaliacao?: string | null;
  capacidadesInteresses?: string | null;
  necessidades?: string | null;
  metasPrazos?: string | null;
  recursosEstrategias?: string | null;
  treinamentoParental?: string | null;
  profissionaisAcompanham?: string | null;
  frequenciaAtendimentos?: string | null;
  geradoEm?: string | null;
}

const COLUNA_POR_CAMPO: Record<keyof PatchPlanoTerapeutico, string> = {
  diagnostico: "Diagnostico",
  anamneseResumo: "Anamnese_Resumo",
  protocolosAvaliacao: "Protocolos_Avaliacao",
  capacidadesInteresses: "Capacidades_Interesses",
  necessidades: "Necessidades",
  metasPrazos: "Metas_Prazos",
  recursosEstrategias: "Recursos_Estrategias",
  treinamentoParental: "Treinamento_Parental",
  profissionaisAcompanham: "Profissionais_Acompanham",
  frequenciaAtendimentos: "Frequencia_Atendimentos",
  geradoEm: "Gerado_Em",
};

export function updatePlanoTerapeutico(id: string, idFicha: string, patch: PatchPlanoTerapeutico): PlanoTerapeutico {
  const patchColunas: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(patch)) {
    patchColunas[COLUNA_POR_CAMPO[campo as keyof PatchPlanoTerapeutico]] = valor;
  }
  runUpdate("PlanosTerapeuticos", "ID_Plano", id, patchColunas);
  touchFicha(idFicha);
  return getPlanoTerapeutico(id) as PlanoTerapeutico;
}

export function deletePlanoTerapeutico(id: string, idFicha: string): void {
  executar("DELETE FROM PlanosTerapeuticos WHERE ID_Plano = ?", [id]);
  touchFicha(idFicha);
}
