import { BrowserWindow, app } from "electron";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

// Links reais, conferidos por busca na web (não inventados): páginas oficiais de download da
// Microsoft/Google, e 2 vídeos tutoriais em português encontrados na busca. São sugestões de
// terceiros — não têm nenhuma relação com o desenvolvimento do app.
const LINK_ONEDRIVE_DOWNLOAD = "https://www.microsoft.com/pt-br/microsoft-365/onedrive/download";
const LINK_ONEDRIVE_AJUDA = "https://support.microsoft.com/pt-br/onedrive/download-onedrive";
const LINK_ONEDRIVE_VIDEO = "https://www.youtube.com/watch?v=vvukCarWCrY";
const LINK_GOOGLE_DRIVE_DOWNLOAD = "https://www.google.com/intl/pt-BR/drive/download/";
const LINK_GOOGLE_DRIVE_VIDEO = "https://www.youtube.com/watch?v=uiQ-CRFUnAE";

function montarHtmlGuia(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 2.5cm 2.25cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11.5pt; color: #1a1a1a; line-height: 1.4; }
  h1 { font-size: 18pt; text-align: center; margin-bottom: 4pt; }
  p.subtitulo { text-align: center; color: #666; font-size: 10pt; margin-top: 0; margin-bottom: 24pt; }
  h2 { font-size: 14pt; border-bottom: 2px solid #7a4c8c; padding-bottom: 4pt; margin-top: 22pt; }
  ol { padding-left: 20pt; }
  li { margin: 4pt 0; }
  a { color: #1155cc; }
  .caixa { background: #faf7fb; border: 1px solid #e5dce8; border-radius: 6pt; padding: 10pt 14pt; margin: 10pt 0; }
  .rodape { margin-top: 32pt; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8pt; }
</style>
</head>
<body>
  <h1>Como configurar backup na nuvem</h1>
  <p class="subtitulo">Guia rápido — Anamnese Neuropsicopedagógica</p>

  <p>O app faz backup automático das suas fichas copiando o banco de dados pra uma pasta do seu
  computador. Se essa pasta estiver dentro do <b>OneDrive</b> ou do <b>Google Drive</b>, o
  backup sobe pra nuvem sozinho — sem custo, usando o espaço gratuito que você já tem. Se você
  já tem um dos dois instalado, pode pular direto pra tela de Backup do app. Se não tem, siga um
  dos guias abaixo.</p>

  <h2>OneDrive (Microsoft) — já vem com o Windows 11</h2>
  <div class="caixa">
    <p><b>Baixar:</b> <a href="${LINK_ONEDRIVE_DOWNLOAD}">${LINK_ONEDRIVE_DOWNLOAD}</a></p>
    <p><b>Página de ajuda oficial:</b> <a href="${LINK_ONEDRIVE_AJUDA}">${LINK_ONEDRIVE_AJUDA}</a></p>
    <p><b>Vídeo sugerido:</b> <a href="${LINK_ONEDRIVE_VIDEO}">${LINK_ONEDRIVE_VIDEO}</a></p>
  </div>
  <ol>
    <li>Se estiver no Windows 11, o OneDrive já está instalado — procure "OneDrive" no menu Iniciar.</li>
    <li>Se não estiver, baixe pelo link acima e abra o instalador.</li>
    <li>Faça login com sua conta Microsoft (ou crie uma gratuita, se não tiver).</li>
    <li>Espere a sincronização inicial terminar (aparece um ícone de nuvem na barra de tarefas).</li>
  </ol>

  <h2>Google Drive</h2>
  <div class="caixa">
    <p><b>Baixar:</b> <a href="${LINK_GOOGLE_DRIVE_DOWNLOAD}">${LINK_GOOGLE_DRIVE_DOWNLOAD}</a></p>
    <p><b>Vídeo sugerido:</b> <a href="${LINK_GOOGLE_DRIVE_VIDEO}">${LINK_GOOGLE_DRIVE_VIDEO}</a></p>
  </div>
  <ol>
    <li>Acesse o link acima e clique em "Fazer o download do Drive para computador".</li>
    <li>Abra o arquivo baixado (<i>GoogleDriveSetup.exe</i>) e siga o instalador.</li>
    <li>Faça login com sua conta Google (ou crie uma gratuita, se não tiver).</li>
    <li>Espere a sincronização inicial terminar.</li>
  </ol>

  <h2>Depois de instalar</h2>
  <p>Volte no app da Anamnese, abra a aba <b>Backup</b> no menu lateral. Se o app detectar o
  OneDrive ou o Google Drive automaticamente, vai aparecer um botão "Usar esta pasta" — é só
  clicar. Se não aparecer, use "Escolher pasta manualmente" e navegue até a pasta do OneDrive
  (geralmente <code>C:\\Usuários\\SeuNome\\OneDrive</code>) ou do Google Drive.</p>

  <p class="rodape">Os vídeos indicados acima são de terceiros, sugestões apenas — não têm
  relação com o desenvolvimento deste aplicativo. Guia gerado automaticamente pelo app.</p>
</body>
</html>`;
}

export async function gerarGuiaBackupPdf(): Promise<Uint8Array> {
  const html = montarHtmlGuia();
  const pastaTemp = mkdtempSync(path.join(app.getPath("temp"), "guia-backup-"));
  const caminhoHtml = path.join(pastaTemp, `${randomUUID()}.html`);
  writeFileSync(caminhoHtml, html, "utf8");

  const janela = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  try {
    await janela.loadFile(caminhoHtml);
    const buffer = await janela.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: { marginType: "default" },
    });
    return new Uint8Array(buffer);
  } finally {
    janela.destroy();
    rmSync(pastaTemp, { recursive: true, force: true });
  }
}
