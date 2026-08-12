import { contextBridge, ipcRenderer } from "electron";
import { CANAIS } from "@main/ipc/channels";
import type { Familiar, Ficha, Perfil, RespostaFicha, SugestaoIA } from "@core/db/types";
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
    uploadLogo: (): Promise<{ cancelado: boolean; perfil?: Perfil }> =>
      ipcRenderer.invoke(CANAIS.perfilUploadLogo),
    removerLogo: (): Promise<Perfil | undefined> => ipcRenderer.invoke(CANAIS.perfilRemoverLogo),
    uploadBorda: (): Promise<{ cancelado: boolean; perfil?: Perfil }> =>
      ipcRenderer.invoke(CANAIS.perfilUploadBorda),
    removerBorda: (): Promise<Perfil | undefined> => ipcRenderer.invoke(CANAIS.perfilRemoverBorda),
  },
  exportar: {
    docx: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarDocx, idFicha),
    pdf: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarPdf, idFicha),
  },
  ia: {
    gerarSugestoes: (idFicha: string): Promise<SugestaoIA> => ipcRenderer.invoke(CANAIS.iaGerarSugestoes, idFicha),
    obterSugestao: (idFicha: string): Promise<SugestaoIA | undefined> =>
      ipcRenderer.invoke(CANAIS.iaObterSugestao, idFicha),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
