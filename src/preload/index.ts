import { contextBridge, ipcRenderer } from "electron";
import { CANAIS } from "@main/ipc/channels";
import type {
  Agendamento,
  AnexoPaciente,
  CategoriaAnexoPaciente,
  DocumentoMedico,
  Familiar,
  Ficha,
  Perfil,
  PlanejamentoIntervencao,
  PlanoTerapeutico,
  RelatorioAvaliativo,
  RespostaFicha,
} from "@core/db/types";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";
import type { NovoAgendamento } from "@main/db/repositories/agendamentosRepository";
import type { NovoPlanejamento, PatchPlanejamento } from "@main/db/repositories/planejamentosRepository";
import type { PatchPlanoTerapeutico } from "@main/db/repositories/planosTerapeuticosRepository";
import type { PatchRelatorioAvaliativo } from "@main/db/repositories/relatoriosAvaliativosRepository";
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
    planejamentoDocx: (idPlanejamento: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarPlanejamentoDocx, idPlanejamento),
    planejamentoPdf: (idPlanejamento: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarPlanejamentoPdf, idPlanejamento),
    planoTerapeuticoDocx: (idPlano: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarPlanoTerapeuticoDocx, idPlano),
    planoTerapeuticoPdf: (idPlano: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarPlanoTerapeuticoPdf, idPlano),
    relatorioAvaliativoDocx: (idRelatorio: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarRelatorioAvaliativoDocx, idRelatorio),
    relatorioAvaliativoPdf: (idRelatorio: string): Promise<{ cancelado: boolean; caminho?: string }> =>
      ipcRenderer.invoke(CANAIS.exportarRelatorioAvaliativoPdf, idRelatorio),
  },
  planejamentos: {
    listar: (idFicha: string): Promise<PlanejamentoIntervencao[]> =>
      ipcRenderer.invoke(CANAIS.planejamentosList, idFicha),
    criar: (dados: NovoPlanejamento): Promise<PlanejamentoIntervencao> =>
      ipcRenderer.invoke(CANAIS.planejamentosCriar, dados),
    atualizar: (id: string, idFicha: string, patch: PatchPlanejamento): Promise<PlanejamentoIntervencao> =>
      ipcRenderer.invoke(CANAIS.planejamentosAtualizar, id, idFicha, patch),
    gerar: (id: string): Promise<PlanejamentoIntervencao> => ipcRenderer.invoke(CANAIS.planejamentosGerar, id),
    remover: (id: string, idFicha: string): Promise<void> =>
      ipcRenderer.invoke(CANAIS.planejamentosRemover, id, idFicha),
  },
  planosTerapeuticos: {
    listar: (idFicha: string): Promise<PlanoTerapeutico[]> =>
      ipcRenderer.invoke(CANAIS.planosTerapeuticosList, idFicha),
    criar: (idFicha: string, dataPlanejamento: string): Promise<PlanoTerapeutico> =>
      ipcRenderer.invoke(CANAIS.planosTerapeuticosCriar, idFicha, dataPlanejamento),
    atualizar: (id: string, idFicha: string, patch: PatchPlanoTerapeutico): Promise<PlanoTerapeutico> =>
      ipcRenderer.invoke(CANAIS.planosTerapeuticosAtualizar, id, idFicha, patch),
    gerar: (id: string): Promise<PlanoTerapeutico> => ipcRenderer.invoke(CANAIS.planosTerapeuticosGerar, id),
    remover: (id: string, idFicha: string): Promise<void> =>
      ipcRenderer.invoke(CANAIS.planosTerapeuticosRemover, id, idFicha),
  },
  relatoriosAvaliativos: {
    listar: (idFicha: string): Promise<RelatorioAvaliativo[]> =>
      ipcRenderer.invoke(CANAIS.relatoriosAvaliativosList, idFicha),
    criar: (idFicha: string, dataInicioAvaliacao: string | null): Promise<RelatorioAvaliativo> =>
      ipcRenderer.invoke(CANAIS.relatoriosAvaliativosCriar, idFicha, dataInicioAvaliacao),
    atualizar: (id: string, idFicha: string, patch: PatchRelatorioAvaliativo): Promise<RelatorioAvaliativo> =>
      ipcRenderer.invoke(CANAIS.relatoriosAvaliativosAtualizar, id, idFicha, patch),
    gerar: (id: string): Promise<RelatorioAvaliativo> => ipcRenderer.invoke(CANAIS.relatoriosAvaliativosGerar, id),
    remover: (id: string, idFicha: string): Promise<void> =>
      ipcRenderer.invoke(CANAIS.relatoriosAvaliativosRemover, id, idFicha),
  },
  anexos: {
    listar: (idFicha: string, categoria: CategoriaAnexoPaciente): Promise<AnexoPaciente[]> =>
      ipcRenderer.invoke(CANAIS.anexosList, idFicha, categoria),
    upload: (
      idFicha: string,
      categoria: CategoriaAnexoPaciente,
      nomePersonalizado: string | null,
    ): Promise<{ cancelado: boolean; anexo?: AnexoPaciente }> =>
      ipcRenderer.invoke(CANAIS.anexosUpload, idFicha, categoria, nomePersonalizado),
    remover: (id: string, idFicha: string): Promise<void> => ipcRenderer.invoke(CANAIS.anexosRemover, id, idFicha),
    abrir: (id: string): Promise<void> => ipcRenderer.invoke(CANAIS.anexosAbrir, id),
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
