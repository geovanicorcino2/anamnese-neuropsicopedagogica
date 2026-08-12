import { contextBridge, ipcRenderer } from "electron";
import { CANAIS } from "@main/ipc/channels";
import type {
  Agendamento,
  DocumentoMedico,
  Familiar,
  Ficha,
  Perfil,
  RelatorioFinal,
  RespostaFicha,
  SugestaoIA,
} from "@core/db/types";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";
import type { EntradaSugestao } from "@main/db/repositories/sugestoesRepository";
import type { EntradaRelatorioFinal } from "@main/db/repositories/relatorioFinalRepository";
import type { NovoAgendamento } from "@main/db/repositories/agendamentosRepository";
import type { ArquivoBackup, PastaNuvemDetectada } from "@main/backup/backupService";

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
  documentos: {
    listar: (idFicha: string): Promise<DocumentoMedico[]> => ipcRenderer.invoke(CANAIS.documentosList, idFicha),
    upload: (
      idFicha: string,
      tipo: string,
      nomePersonalizado: string | null,
    ): Promise<{ cancelado: boolean; documento?: DocumentoMedico }> =>
      ipcRenderer.invoke(CANAIS.documentosUpload, idFicha, tipo, nomePersonalizado),
    remover: (id: string, idFicha: string): Promise<void> =>
      ipcRenderer.invoke(CANAIS.documentosRemover, id, idFicha),
    abrir: (id: string): Promise<void> => ipcRenderer.invoke(CANAIS.documentosAbrir, id),
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
    intervencaoDocx: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarIntervencaoDocx, idFicha),
    intervencaoPdf: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarIntervencaoPdf, idFicha),
    relatorioFinalDocx: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarRelatorioFinalDocx, idFicha),
    relatorioFinalPdf: (idFicha: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarRelatorioFinalPdf, idFicha),
  },
  ia: {
    salvarEntrada: (idFicha: string, entrada: EntradaSugestao): Promise<SugestaoIA> =>
      ipcRenderer.invoke(CANAIS.iaSalvarEntrada, idFicha, entrada),
    gerarSugestoes: (idFicha: string): Promise<SugestaoIA> => ipcRenderer.invoke(CANAIS.iaGerarSugestoes, idFicha),
    obterSugestao: (idFicha: string): Promise<SugestaoIA | undefined> =>
      ipcRenderer.invoke(CANAIS.iaObterSugestao, idFicha),
  },
  relatorioFinal: {
    salvarEntrada: (idFicha: string, entrada: EntradaRelatorioFinal): Promise<RelatorioFinal> =>
      ipcRenderer.invoke(CANAIS.relatorioFinalSalvarEntrada, idFicha, entrada),
    gerar: (idFicha: string): Promise<RelatorioFinal> => ipcRenderer.invoke(CANAIS.relatorioFinalGerar, idFicha),
    obter: (idFicha: string): Promise<RelatorioFinal | undefined> =>
      ipcRenderer.invoke(CANAIS.relatorioFinalObter, idFicha),
  },
  agendamentos: {
    listarIntervalo: (dataInicio: string, dataFim: string): Promise<Agendamento[]> =>
      ipcRenderer.invoke(CANAIS.agendamentosListarIntervalo, dataInicio, dataFim),
    criar: (dados: NovoAgendamento): Promise<Agendamento> => ipcRenderer.invoke(CANAIS.agendamentosCriar, dados),
    remover: (id: string): Promise<void> => ipcRenderer.invoke(CANAIS.agendamentosRemover, id),
  },
  backup: {
    detectarNuvem: (): Promise<PastaNuvemDetectada[]> => ipcRenderer.invoke(CANAIS.backupDetectarNuvem),
    usarPastaDetectada: (provedor: "onedrive" | "googledrive"): Promise<Perfil | undefined> =>
      ipcRenderer.invoke(CANAIS.backupUsarPastaDetectada, provedor),
    escolherPastaManual: (): Promise<Perfil | undefined | null> =>
      ipcRenderer.invoke(CANAIS.backupEscolherPastaManual),
    removerPasta: (): Promise<Perfil | undefined> => ipcRenderer.invoke(CANAIS.backupRemoverPasta),
    fazerAgora: (): Promise<ArquivoBackup> => ipcRenderer.invoke(CANAIS.backupFazerAgora),
    listar: (): Promise<ArquivoBackup[]> => ipcRenderer.invoke(CANAIS.backupListar),
    restaurar: (caminho: string): Promise<void> => ipcRenderer.invoke(CANAIS.backupRestaurar, caminho),
    restaurarViaDialogo: (): Promise<boolean> => ipcRenderer.invoke(CANAIS.backupRestaurarViaDialogo),
    reiniciarApp: (): Promise<void> => ipcRenderer.invoke(CANAIS.backupReiniciarApp),
    baixarGuia: (): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.backupBaixarGuia),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
