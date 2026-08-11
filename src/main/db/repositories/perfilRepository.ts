import type { Perfil } from "@core/db/types";
import { executar, primeiro } from "@main/db/connection";
import { generateId, runUpdate } from "@main/db/repositories/helpers";

// Extraído do timbre do docx original — ver anamnese_identidade_visual.md (memória do projeto).
const PERFIL_PADRAO = {
  Nome_Profissional: "Ana Paula de M. Gontijo",
  Titulo: "Neuropsicopedagoga Especialista em ABA",
  Nome_Clinica: "Humana Clínica de Saúde Integrada",
};

export function getPerfil(): Perfil | undefined {
  return primeiro<Perfil>("SELECT * FROM Perfil LIMIT 1");
}

export function seedPerfilSeNecessario(): void {
  const existente = getPerfil();
  if (existente) return;

  const id = generateId("perfil");
  executar(`INSERT INTO Perfil (ID_Perfil, Nome_Profissional, Titulo, Nome_Clinica) VALUES (?, ?, ?, ?)`, [
    id,
    PERFIL_PADRAO.Nome_Profissional,
    PERFIL_PADRAO.Titulo,
    PERFIL_PADRAO.Nome_Clinica,
  ]);
}

export interface PatchPerfil {
  Nome_Profissional?: string;
  Titulo?: string;
  Nome_Clinica?: string;
}

export function updatePerfil(patch: PatchPerfil): void {
  const perfil = getPerfil();
  if (!perfil) return;
  runUpdate<Perfil>("Perfil", "ID_Perfil", perfil.ID_Perfil, patch);
}
