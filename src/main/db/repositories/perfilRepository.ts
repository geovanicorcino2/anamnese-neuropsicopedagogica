import type { Perfil, ProvedorIA } from "@core/db/types";
import { executar, primeiro } from "@main/db/connection";
import { generateId, runUpdate } from "@main/db/repositories/helpers";
import { LOGO_ANAPAULA_JPEG_BASE64 } from "@main/assets/identidadeVisual";

// Extraído do timbre do docx original — ver anamnese_identidade_visual.md (memória do projeto).
// A borda NÃO é semeada aqui de propósito: enquanto Borda_Base64 for NULL, os builders caem no
// fallback das formas vetoriais originais (BORDA_ROXA/BORDA_VERDE), que é exatamente o padrão
// visual da Ana Paula — não precisa duplicar esse dado no banco.
const PERFIL_PADRAO = {
  Nome_Profissional: "Ana Paula de M. Gontijo",
  Titulo: "Neuropsicopedagoga Especialista em ABA",
  Nome_Clinica: "Humana Clínica de Saúde Integrada",
  Logo_Base64: LOGO_ANAPAULA_JPEG_BASE64,
  Logo_Mime: "image/jpeg",
};

export function getPerfil(): Perfil | undefined {
  return primeiro<Perfil>("SELECT * FROM Perfil LIMIT 1");
}

export function seedPerfilSeNecessario(): void {
  const existente = getPerfil();
  if (existente) return;

  const id = generateId("perfil");
  executar(
    `INSERT INTO Perfil (ID_Perfil, Nome_Profissional, Titulo, Nome_Clinica, Logo_Base64, Logo_Mime)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      PERFIL_PADRAO.Nome_Profissional,
      PERFIL_PADRAO.Titulo,
      PERFIL_PADRAO.Nome_Clinica,
      PERFIL_PADRAO.Logo_Base64,
      PERFIL_PADRAO.Logo_Mime,
    ],
  );
}

export interface PatchPerfil {
  Nome_Profissional?: string;
  Titulo?: string;
  Nome_Clinica?: string;
  Logo_Base64?: string | null;
  Logo_Mime?: string | null;
  Borda_Base64?: string | null;
  Borda_Mime?: string | null;
  IA_Provedor?: ProvedorIA | null;
  IA_Chave?: string | null;
  IA_Modelo?: string | null;
  IA_Url_Personalizada?: string | null;
  Pasta_Backup?: string | null;
}

export function updatePerfil(patch: PatchPerfil): void {
  const perfil = getPerfil();
  if (!perfil) return;
  runUpdate<Perfil>("Perfil", "ID_Perfil", perfil.ID_Perfil, patch);
}
