import type { AnexoPaciente, CategoriaAnexoPaciente } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId } from "@main/db/repositories/helpers";
import { touchFicha } from "@main/db/repositories/fichasRepository";

// Mesmo padrão de documentosRepository.ts (Histórico Médico), só com Categoria fixa (uma das 3
// abas novas) no lugar do Tipo livre.
export function listAnexos(idFicha: string, categoria: CategoriaAnexoPaciente): AnexoPaciente[] {
  return todos<AnexoPaciente>(
    "SELECT * FROM AnexosPaciente WHERE ID_Ficha = ? AND Categoria = ? ORDER BY Criado_Em DESC",
    [idFicha, categoria],
  );
}

export function getAnexo(id: string): AnexoPaciente | undefined {
  return primeiro<AnexoPaciente>("SELECT * FROM AnexosPaciente WHERE ID_Anexo = ?", [id]);
}

export interface NovoAnexo {
  idFicha: string;
  categoria: CategoriaAnexoPaciente;
  nomePersonalizado?: string | null;
  nomeArquivo: string;
  mime: string;
  base64: string;
}

export function createAnexo(dados: NovoAnexo): AnexoPaciente {
  const id = generateId("anexo");
  const agora = agoraIso();
  executar(
    `INSERT INTO AnexosPaciente (ID_Anexo, ID_Ficha, Categoria, Nome_Personalizado, Nome_Arquivo, Mime, Base64, Criado_Em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, dados.idFicha, dados.categoria, dados.nomePersonalizado ?? null, dados.nomeArquivo, dados.mime, dados.base64, agora],
  );
  touchFicha(dados.idFicha);
  return getAnexo(id) as AnexoPaciente;
}

export function deleteAnexo(id: string, idFicha: string): void {
  executar("DELETE FROM AnexosPaciente WHERE ID_Anexo = ?", [id]);
  touchFicha(idFicha);
}
