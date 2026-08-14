import { app, shell } from "electron";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AnexoPaciente } from "@core/db/types";

// Mesmo padrão de src/main/documentos/abrirDocumento.ts (Histórico Médico), só pra AnexoPaciente.
export async function abrirAnexo(anexo: AnexoPaciente): Promise<void> {
  const pastaTemp = path.join(app.getPath("temp"), "anamnese-anexos", anexo.ID_Anexo);
  mkdirSync(pastaTemp, { recursive: true });

  const caminho = path.join(pastaTemp, anexo.Nome_Arquivo);
  writeFileSync(caminho, Buffer.from(anexo.Base64, "base64"));

  const erro = await shell.openPath(caminho);
  if (erro) {
    throw new Error(`Não foi possível abrir o arquivo: ${erro}`);
  }
}
