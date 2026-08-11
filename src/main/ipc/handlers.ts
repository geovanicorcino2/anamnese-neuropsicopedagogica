import { ipcMain } from "electron";
import { CANAIS } from "@main/ipc/channels";
import {
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  respostasRepository,
} from "@main/db";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";
import { exportarFichaDocx, exportarFichaPdf } from "@main/export/exportarFicha";

export function registrarHandlersIpc(): void {
  ipcMain.handle(CANAIS.fichasList, () => fichasRepository.listFichas());
  ipcMain.handle(CANAIS.fichasGet, (_evento, id: string) => fichasRepository.getFicha(id));
  ipcMain.handle(CANAIS.fichasCreate, (_evento, dados: NovaFicha) => fichasRepository.createFicha(dados));
  ipcMain.handle(CANAIS.fichasUpdate, (_evento, id: string, patch: PatchFicha) =>
    fichasRepository.updateFicha(id, patch),
  );
  ipcMain.handle(CANAIS.fichasDelete, (_evento, id: string) => fichasRepository.deleteFicha(id));

  ipcMain.handle(CANAIS.respostasList, (_evento, idFicha: string) => respostasRepository.listRespostas(idFicha));
  ipcMain.handle(CANAIS.respostasSave, (_evento, idFicha: string, idCampo: string, valor: string) =>
    respostasRepository.salvarResposta(idFicha, idCampo, valor),
  );
  ipcMain.handle(
    CANAIS.respostasSaveBatch,
    (_evento, idFicha: string, respostas: Array<{ idCampo: string; valor: string }>) =>
      respostasRepository.salvarRespostasEmLote(idFicha, respostas),
  );

  ipcMain.handle(CANAIS.familiaresList, (_evento, idFicha: string) => familiaresRepository.listFamiliares(idFicha));
  ipcMain.handle(CANAIS.familiaresCreate, (_evento, dados: NovoFamiliar) =>
    familiaresRepository.createFamiliar(dados),
  );
  ipcMain.handle(
    CANAIS.familiaresUpdate,
    (_evento, id: string, idFicha: string, patch: PatchFamiliar) =>
      familiaresRepository.updateFamiliar(id, idFicha, patch),
  );
  ipcMain.handle(CANAIS.familiaresDelete, (_evento, id: string, idFicha: string) =>
    familiaresRepository.deleteFamiliar(id, idFicha),
  );

  ipcMain.handle(CANAIS.perfilGet, () => perfilRepository.getPerfil());
  ipcMain.handle(CANAIS.perfilUpdate, (_evento, patch: PatchPerfil) => perfilRepository.updatePerfil(patch));

  ipcMain.handle(CANAIS.exportarDocx, (_evento, idFicha: string) => exportarFichaDocx(idFicha));
  ipcMain.handle(CANAIS.exportarPdf, (_evento, idFicha: string) => exportarFichaPdf(idFicha));
}
