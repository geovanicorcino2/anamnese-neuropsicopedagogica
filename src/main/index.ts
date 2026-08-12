import { app, BrowserWindow, shell } from "electron";
import { join } from "node:path";
import { iniciarBanco } from "@main/db";
import { registrarHandlersIpc } from "@main/ipc/handlers";
import { instalarMenuAplicativo, instalarMenuContexto } from "@main/menu";
import { fazerBackupSilencioso } from "@main/backup/backupService";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.on("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  instalarMenuContexto(win);

  const devServerUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId("br.com.corcinoconsultoria.anamnese");
  instalarMenuAplicativo();

  await iniciarBanco();
  registrarHandlersIpc();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Backup automático: se o usuário configurou uma pasta (aba Backup), cada fechamento do app
// grava uma cópia fresca do banco lá — cobre o cenário de "fechei o dia e o notebook quebrou
// antes de eu abrir de novo". Silencioso: nunca impede o app de fechar.
app.on("before-quit", () => {
  fazerBackupSilencioso();
});
