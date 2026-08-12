import { dialog } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";

const MIME_POR_EXTENSAO: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export interface ArquivoEscolhido {
  base64: string;
  mime: string;
  nomeArquivo: string;
}

// Igual a src/main/perfil/uploadImagem.ts, mas com uma lista bem mais ampla de extensões — os
// documentos do Histórico Médico costumam ser PDF/Word, não só imagem.
export async function escolherDocumento(titulo: string): Promise<ArquivoEscolhido | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: titulo,
    properties: ["openFile"],
    filters: [{ name: "Documentos", extensions: ["pdf", "doc", "docx", "png", "jpg", "jpeg"] }],
  });

  if (canceled || filePaths.length === 0) return null;

  const caminho = filePaths[0];
  const extensao = path.extname(caminho).toLowerCase();
  const mime = MIME_POR_EXTENSAO[extensao];
  if (!mime) {
    throw new Error("Formato de arquivo não suportado — use PDF, Word (.doc/.docx), PNG ou JPEG.");
  }

  const bytes = readFileSync(caminho);
  return { base64: bytes.toString("base64"), mime, nomeArquivo: path.basename(caminho) };
}
