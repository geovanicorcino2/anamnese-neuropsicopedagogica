import { app, shell } from "electron";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { DocumentoMedico } from "@core/db/types";

// Grava o documento (guardado como base64 no SQLite) num arquivo temporário com o nome original
// e pede pro Windows abrir com o programa padrão — não mantemos cópia em disco fora disso.
export async function abrirDocumento(documento: DocumentoMedico): Promise<void> {
  const pastaTemp = path.join(app.getPath("temp"), "anamnese-documentos", documento.ID_Documento);
  mkdirSync(pastaTemp, { recursive: true });

  const caminho = path.join(pastaTemp, documento.Nome_Arquivo);
  writeFileSync(caminho, Buffer.from(documento.Base64, "base64"));

  const erro = await shell.openPath(caminho);
  if (erro) {
    throw new Error(`Não foi possível abrir o arquivo: ${erro}`);
  }
}
