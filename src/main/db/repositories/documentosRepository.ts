import type { DocumentoMedico } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId } from "@main/db/repositories/helpers";
import { touchFicha } from "@main/db/repositories/fichasRepository";

export function listDocumentos(idFicha: string): DocumentoMedico[] {
  return todos<DocumentoMedico>(
    "SELECT * FROM DocumentosMedicos WHERE ID_Ficha = ? ORDER BY Criado_Em DESC",
    [idFicha],
  );
}

export function getDocumento(id: string): DocumentoMedico | undefined {
  return primeiro<DocumentoMedico>("SELECT * FROM DocumentosMedicos WHERE ID_Documento = ?", [id]);
}

export interface NovoDocumento {
  idFicha: string;
  tipo: string;
  nomePersonalizado?: string | null;
  nomeArquivo: string;
  mime: string;
  base64: string;
}

export function createDocumento(dados: NovoDocumento): DocumentoMedico {
  const id = generateId("documento");
  const agora = agoraIso();

  executar(
    `INSERT INTO DocumentosMedicos (ID_Documento, ID_Ficha, Tipo, Nome_Personalizado, Nome_Arquivo, Mime, Base64, Criado_Em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, dados.idFicha, dados.tipo, dados.nomePersonalizado ?? null, dados.nomeArquivo, dados.mime, dados.base64, agora],
  );
  touchFicha(dados.idFicha);

  return getDocumento(id) as DocumentoMedico;
}

export function deleteDocumento(id: string, idFicha: string): void {
  executar("DELETE FROM DocumentosMedicos WHERE ID_Documento = ?", [id]);
  touchFicha(idFicha);
}
