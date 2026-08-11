import { contextBridge, ipcRenderer } from "electron";
import { CANAIS } from "@main/ipc/channels";
import type { Familiar, Ficha, Perfil, RespostaFicha } from "@core/db/types";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";

const api = {
  fichas: {
    listar: (): Promise<Ficha[]> => ipcRenderer.invoke(CANAIS.fichasList),
    obter: (id: string): Promise<Ficha | undefined> => ipcRenderer.invoke(CANAIS.fichasGet, id),
    criar: (dados: NovaFicha): Promise<Ficha> => ipcRenderer.invoke(CANAIS.fichasCreate, dados),
    atualizar: (id: string, patch: PatchFicha): Promise<void> => ipcRenderer.invoke(CANAIS.fichasUpdate, id, patch),
    remover: (id: string): Promise<void> => ipcRenderer.invoke(CANAIS.fichasDelete, id),
  },
  respostas: {
    listar: (idFicha: string): Promise<RespostaFicha[]> => ipcRenderer.invoke(CANAIS.respostasList, idFicha),
    salvar: (idFicha: string, idCampo: string, valor: string): Promise<void> =>
      ipcRenderer.invoke(CANAIS.respostasSave, idFicha, idCampo, valor),
    salvarEmLote: (idFicha: string, respostas: Array<{ idCampo: string; valor: string }>): Promise<void> =>
      ipcRenderer.invoke(CANAIS.respostasSaveBatch, idFicha, respostas),
  },
  familiares: {
    listar: (idFicha: string): Promise<Familiar[]> => ipcRenderer.invoke(CANAIS.familiaresList, idFicha),
    criar: (dados: NovoFamiliar): Promise<Familiar> => ipcRenderer.invoke(CANAIS.familiaresCreate, dados),
    atualizar: (id: string, idFicha: string, patch: PatchFamiliar): Promise<void> =>
      ipcRenderer.invoke(CANAIS.familiaresUpdate, id, idFicha, patch),
    remover: (id: string, idFicha: string): Promise<void> =>
      ipcRenderer.invoke(CANAIS.familiaresDelete, id, idFicha),
  },
  perfil: {
    obter: (): Promise<Perfil | undefined> => ipcRenderer.invoke(CANAIS.perfilGet),
    atualizar: (patch: PatchPerfil): Promise<void> => ipcRenderer.invoke(CANAIS.perfilUpdate, patch),
  },
  exportar: {
    docx: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarDocx, idFicha),
    pdf: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarPdf, idFicha),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
