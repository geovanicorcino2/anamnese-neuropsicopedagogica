import { app, dialog, ipcMain } from "electron";
import { writeFileSync } from "node:fs";
import { CANAIS } from "@main/ipc/channels";
import {
  agendamentosRepository,
  documentosRepository,
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  relatorioFinalRepository,
  respostasRepository,
  sugestoesRepository,
} from "@main/db";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";
import type { EntradaSugestao } from "@main/db/repositories/sugestoesRepository";
import type { EntradaRelatorioFinal } from "@main/db/repositories/relatorioFinalRepository";
import type { NovoAgendamento } from "@main/db/repositories/agendamentosRepository";
import { exportarFichaDocx, exportarFichaPdf } from "@main/export/exportarFicha";
import { exportarIntervencaoDocx, exportarIntervencaoPdf } from "@main/export/exportarIntervencao";
import { exportarRelatorioFinalDocx, exportarRelatorioFinalPdf } from "@main/export/exportarRelatorioFinal";
import { escolherImagem } from "@main/perfil/uploadImagem";
import { escolherDocumento } from "@main/documentos/uploadDocumento";
import { abrirDocumento } from "@main/documentos/abrirDocumento";
import { gerarSugestoesParaFicha } from "@main/ia/gerarSugestoes";
import { gerarRelatorioFinalParaFicha } from "@main/ia/gerarRelatorioFinal";
import * as backupService from "@main/backup/backupService";
import { gerarGuiaBackupPdf } from "@main/backup/gerarGuiaBackupPdf";

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

  ipcMain.handle(CANAIS.documentosList, (_evento, idFicha: string) => documentosRepository.listDocumentos(idFicha));
  ipcMain.handle(
    CANAIS.documentosUpload,
    async (_evento, idFicha: string, tipo: string, nomePersonalizado: string | null) => {
      const arquivo = await escolherDocumento("Selecionar documento médico");
      if (!arquivo) return { cancelado: true };
      const documento = documentosRepository.createDocumento({
        idFicha,
        tipo,
        nomePersonalizado,
        nomeArquivo: arquivo.nomeArquivo,
        mime: arquivo.mime,
        base64: arquivo.base64,
      });
      return { cancelado: false, documento };
    },
  );
  ipcMain.handle(CANAIS.documentosRemover, (_evento, id: string, idFicha: string) =>
    documentosRepository.deleteDocumento(id, idFicha),
  );
  ipcMain.handle(CANAIS.documentosAbrir, (_evento, id: string) => {
    const documento = documentosRepository.getDocumento(id);
    if (!documento) throw new Error("Documento não encontrado.");
    return abrirDocumento(documento);
  });

  ipcMain.handle(CANAIS.perfilGet, () => perfilRepository.getPerfil());
  ipcMain.handle(CANAIS.perfilUpdate, (_evento, patch: PatchPerfil) => perfilRepository.updatePerfil(patch));

  ipcMain.handle(CANAIS.perfilUploadLogo, async () => {
    const imagem = await escolherImagem("Escolher logo do relatório");
    if (!imagem) return { cancelado: true };
    perfilRepository.updatePerfil({ Logo_Base64: imagem.base64, Logo_Mime: imagem.mime });
    return { cancelado: false, perfil: perfilRepository.getPerfil() };
  });
  ipcMain.handle(CANAIS.perfilRemoverLogo, () => {
    perfilRepository.updatePerfil({ Logo_Base64: null, Logo_Mime: null });
    return perfilRepository.getPerfil();
  });
  ipcMain.handle(CANAIS.perfilUploadBorda, async () => {
    const imagem = await escolherImagem("Escolher imagem de borda do relatório");
    if (!imagem) return { cancelado: true };
    perfilRepository.updatePerfil({ Borda_Base64: imagem.base64, Borda_Mime: imagem.mime });
    return { cancelado: false, perfil: perfilRepository.getPerfil() };
  });
  ipcMain.handle(CANAIS.perfilRemoverBorda, () => {
    perfilRepository.updatePerfil({ Borda_Base64: null, Borda_Mime: null });
    return perfilRepository.getPerfil();
  });

  ipcMain.handle(CANAIS.exportarDocx, (_evento, idFicha: string) => exportarFichaDocx(idFicha));
  ipcMain.handle(CANAIS.exportarPdf, (_evento, idFicha: string) => exportarFichaPdf(idFicha));
  ipcMain.handle(CANAIS.exportarIntervencaoDocx, (_evento, idFicha: string) => exportarIntervencaoDocx(idFicha));
  ipcMain.handle(CANAIS.exportarIntervencaoPdf, (_evento, idFicha: string) => exportarIntervencaoPdf(idFicha));
  ipcMain.handle(CANAIS.exportarRelatorioFinalDocx, (_evento, idFicha: string) => exportarRelatorioFinalDocx(idFicha));
  ipcMain.handle(CANAIS.exportarRelatorioFinalPdf, (_evento, idFicha: string) => exportarRelatorioFinalPdf(idFicha));

  ipcMain.handle(CANAIS.iaSalvarEntrada, (_evento, idFicha: string, entrada: EntradaSugestao) =>
    sugestoesRepository.salvarEntrada(idFicha, entrada),
  );
  ipcMain.handle(CANAIS.iaGerarSugestoes, (_evento, idFicha: string) => gerarSugestoesParaFicha(idFicha));
  ipcMain.handle(CANAIS.iaObterSugestao, (_evento, idFicha: string) => sugestoesRepository.getSugestao(idFicha));

  ipcMain.handle(CANAIS.relatorioFinalSalvarEntrada, (_evento, idFicha: string, entrada: EntradaRelatorioFinal) =>
    relatorioFinalRepository.salvarEntrada(idFicha, entrada),
  );
  ipcMain.handle(CANAIS.relatorioFinalGerar, (_evento, idFicha: string) => gerarRelatorioFinalParaFicha(idFicha));
  ipcMain.handle(CANAIS.relatorioFinalObter, (_evento, idFicha: string) =>
    relatorioFinalRepository.getRelatorioFinal(idFicha),
  );

  ipcMain.handle(CANAIS.agendamentosListarIntervalo, (_evento, dataInicio: string, dataFim: string) =>
    agendamentosRepository.listPorIntervalo(dataInicio, dataFim),
  );
  ipcMain.handle(CANAIS.agendamentosCriar, (_evento, dados: NovoAgendamento) =>
    agendamentosRepository.createAgendamento(dados),
  );
  ipcMain.handle(CANAIS.agendamentosRemover, (_evento, id: string) => agendamentosRepository.deleteAgendamento(id));

  ipcMain.handle(CANAIS.backupDetectarNuvem, () => backupService.detectarPastasNuvem());
  ipcMain.handle(CANAIS.backupUsarPastaDetectada, (_evento, provedor: "onedrive" | "googledrive") =>
    backupService.usarPastaDetectada(provedor),
  );
  ipcMain.handle(CANAIS.backupEscolherPastaManual, () => backupService.escolherPastaManual());
  ipcMain.handle(CANAIS.backupRemoverPasta, () => backupService.removerPastaBackup());
  ipcMain.handle(CANAIS.backupFazerAgora, () => backupService.fazerBackupAgora());
  ipcMain.handle(CANAIS.backupListar, () => backupService.listarBackups());
  ipcMain.handle(CANAIS.backupRestaurar, (_evento, caminho: string) => backupService.restaurarBackup(caminho));
  ipcMain.handle(CANAIS.backupRestaurarViaDialogo, () => backupService.restaurarBackupViaDialogo());
  ipcMain.handle(CANAIS.backupReiniciarApp, () => {
    app.relaunch();
    app.exit();
  });
  ipcMain.handle(CANAIS.backupBaixarGuia, async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Salvar guia de configuração de backup",
      defaultPath: "Guia - Configurar Backup na Nuvem.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (canceled || !filePath) return { cancelado: true };
    const bytes = await gerarGuiaBackupPdf();
    writeFileSync(filePath, bytes);
    return { cancelado: false, caminho: filePath };
  });
}
