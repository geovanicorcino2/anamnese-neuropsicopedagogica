import { dialog } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";

const MIME_POR_EXTENSAO: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export interface ImagemEscolhida {
  base64: string;
  mime: string;
}

// Abre o diálogo nativo de arquivo, lê a imagem escolhida e devolve já em base64.
// Retorna null se o usuário cancelar.
export async function escolherImagem(titulo: string): Promise<ImagemEscolhida | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: titulo,
    properties: ["openFile"],
    filters: [{ name: "Imagem (PNG ou JPEG)", extensions: ["png", "jpg", "jpeg"] }],
  });

  if (canceled || filePaths.length === 0) return null;

  const caminho = filePaths[0];
  const extensao = path.extname(caminho).toLowerCase();
  const mime = MIME_POR_EXTENSAO[extensao];
  if (!mime) {
    throw new Error("Formato de imagem não suportado — use PNG ou JPEG.");
  }

  const bytes = readFileSync(caminho);
  return { base64: bytes.toString("base64"), mime };
}
