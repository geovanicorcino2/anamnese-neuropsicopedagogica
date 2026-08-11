import type { Familiar } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { generateId, runUpdate } from "@main/db/repositories/helpers";
import { touchFicha } from "@main/db/repositories/fichasRepository";

export function listFamiliares(idFicha: string): Familiar[] {
  return todos<Familiar>("SELECT * FROM Familiares WHERE ID_Ficha = ? ORDER BY Ordem ASC", [idFicha]);
}

export interface NovoFamiliar {
  idFicha: string;
  nome: string;
  idade?: string | null;
  relacao?: string | null;
}

export function createFamiliar(dados: NovoFamiliar): Familiar {
  const id = generateId("familiar");
  const proximaOrdem = todos<{ total: number }>(
    "SELECT COUNT(*) as total FROM Familiares WHERE ID_Ficha = ?",
    [dados.idFicha],
  )[0]?.total ?? 0;

  executar(
    `INSERT INTO Familiares (ID_Familiar, ID_Ficha, Nome, Idade, Relacao, Ordem) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, dados.idFicha, dados.nome, dados.idade ?? null, dados.relacao ?? null, proximaOrdem],
  );
  touchFicha(dados.idFicha);

  return primeiro<Familiar>("SELECT * FROM Familiares WHERE ID_Familiar = ?", [id]) as Familiar;
}

export interface PatchFamiliar {
  Nome?: string;
  Idade?: string | null;
  Relacao?: string | null;
}

export function updateFamiliar(id: string, idFicha: string, patch: PatchFamiliar): void {
  runUpdate<Familiar>("Familiares", "ID_Familiar", id, patch);
  touchFicha(idFicha);
}

export function deleteFamiliar(id: string, idFicha: string): void {
  executar("DELETE FROM Familiares WHERE ID_Familiar = ?", [id]);
  touchFicha(idFicha);
}
