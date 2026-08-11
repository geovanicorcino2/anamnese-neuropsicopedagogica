import { BrowserWindow, app } from "electron";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ConteudoFicha } from "@core/services/anamneseContent";
import { montarHtmlFicha } from "@main/export/pdfHtmlTemplate";

export async function gerarPdfAnamnese(conteudo: ConteudoFicha): Promise<Uint8Array> {
  const html = montarHtmlFicha(conteudo);
  const pastaTemp = mkdtempSync(path.join(app.getPath("temp"), "anamnese-pdf-"));
  const caminhoHtml = path.join(pastaTemp, `${randomUUID()}.html`);
  writeFileSync(caminhoHtml, html, "utf8");

  const janela = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true },
  });

  try {
    await janela.loadFile(caminhoHtml);
    const buffer = await janela.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: { marginType: "custom", top: 0, bottom: 0, left: 0, right: 0 },
    });
    return new Uint8Array(buffer);
  } finally {
    janela.destroy();
    rmSync(pastaTemp, { recursive: true, force: true });
  }
}
