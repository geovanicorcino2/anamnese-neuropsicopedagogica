import type { Ficha, StatusFicha } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId, runUpdate } from "@main/db/repositories/helpers";

export function listFichas(): Ficha[] {
  return todos<Ficha>("SELECT * FROM Fichas ORDER BY Atualizado_Em DESC");
}

export function getFicha(id: string): Ficha | undefined {
  return primeiro<Ficha>("SELECT * FROM Fichas WHERE ID_Ficha = ?", [id]);
}

export interface NovaFicha {
  nomeCrianca: string;
  dataNascimento?: string | null;
  escola?: string | null;
  dataInicioAcompanhamento?: string | null;
}

export function createFicha(dados: NovaFicha): Ficha {
  const id = generateId("ficha");
  const agora = agoraIso();

  executar(
    `INSERT INTO Fichas (ID_Ficha, Nome_Crianca, Data_Nascimento, Escola, Status, Criado_Em, Atualizado_Em, Data_Inicio_Acompanhamento)
     VALUES (?, ?, ?, ?, 'Rascunho', ?, ?, ?)`,
    [
      id,
      dados.nomeCrianca,
      dados.dataNascimento ?? null,
      dados.escola ?? null,
      agora,
      agora,
      dados.dataInicioAcompanhamento ?? null,
    ],
  );

  return getFicha(id) as Ficha;
}

export interface PatchFicha {
  Nome_Crianca?: string;
  Data_Nascimento?: string | null;
  Escola?: string | null;
  Status?: StatusFicha;
  Data_Inicio_Acompanhamento?: string | null;
}

export function updateFicha(id: string, patch: PatchFicha): void {
  runUpdate<Ficha>("Fichas", "ID_Ficha", id, { ...patch, Atualizado_Em: agoraIso() });
}

export function touchFicha(id: string): void {
  executar("UPDATE Fichas SET Atualizado_Em = ? WHERE ID_Ficha = ?", [agoraIso(), id]);
}

export function deleteFicha(id: string): void {
  executar("DELETE FROM Fichas WHERE ID_Ficha = ?", [id]);
}
