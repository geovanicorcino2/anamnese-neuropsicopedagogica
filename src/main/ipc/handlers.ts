import { app, dialog, ipcMain } from "electron";
import { writeFileSync } from "node:fs";
import { CANAIS } from "@main/ipc/channels";
import {
  agendamentosRepository,
  anexosRepository,
  documentosRepository,
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  planejamentosRepository,
  planosTerapeuticosRepository,
  relatoriosAvaliativosRepository,
  respostasRepository,
} from "@main/db";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";
import type { NovoAgendamento } from "@main/db/repositories/agendamentosRepository";
import type { NovoPlanejamento, PatchPlanejamento } from "@main/db/repositories/planejamentosRepository";
import type { PatchPlanoTerapeutico } from "@main/db/repositories/planosTerapeuticosRepository";
import type { PatchRelatorioAvaliativo } from "@main/db/repositories/relatoriosAvaliativosRepository";
import type { CategoriaAnexoPaciente } from "@core/db/types";
import { exportarFichaDocx, exportarFichaPdf } from "@main/export/exportarFicha";
import { exportarIntervencaoDocx, exportarIntervencaoPdf } from "@main/export/exportarIntervencao";
import { exportarPlanoTerapeuticoDocx, exportarPlanoTerapeuticoPdf } from "@main/export/exportarPlanoTerapeutico";
import {
  exportarRelatorioAvaliativoDocx,
  exportarRelatorioAvaliativoPdf,
} from "@main/export/exportarRelatorioAvaliativo";
import { escolherImagem } from "@main/perfil/uploadImagem";
import { escolherDocumento } from "@main/documentos/uploadDocumento";
import { abrirDocumento } from "@main/documentos/abrirDocumento";
import { abrirAnexo } from "@main/anexos/abrirAnexo";
import { gerarSugestoesParaFicha } from "@main/ia/gerarSugestoes";
import { gerarPlanoTerapeuticoParaFicha } from "@main/ia/gerarPlanoTerapeutico";
import { gerarRelatorioAvaliativoParaFicha } from "@main/ia/gerarRelatorioAvaliativo";
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
  ipcMain.handle(CANAIS.exportarPlanejamentoDocx, (_evento, idPlanejamento: string) =>
    exportarIntervencaoDocx(idPlanejamento),
  );
  ipcMain.handle(CANAIS.exportarPlanejamentoPdf, (_evento, idPlanejamento: string) =>
    exportarIntervencaoPdf(idPlanejamento),
  );
  ipcMain.handle(CANAIS.exportarPlanoTerapeuticoDocx, (_evento, idPlano: string) =>
    exportarPlanoTerapeuticoDocx(idPlano),
  );
  ipcMain.handle(CANAIS.exportarPlanoTerapeuticoPdf, (_evento, idPlano: string) =>
    exportarPlanoTerapeuticoPdf(idPlano),
  );
  ipcMain.handle(CANAIS.exportarRelatorioAvaliativoDocx, (_evento, idRelatorio: string) =>
    exportarRelatorioAvaliativoDocx(idRelatorio),
  );
  ipcMain.handle(CANAIS.exportarRelatorioAvaliativoPdf, (_evento, idRelatorio: string) =>
    exportarRelatorioAvaliativoPdf(idRelatorio),
  );

  ipcMain.handle(CANAIS.planejamentosList, (_evento, idFicha: string) =>
    planejamentosRepository.listPlanejamentos(idFicha),
  );
  ipcMain.handle(CANAIS.planejamentosCriar, (_evento, dados: NovoPlanejamento) =>
    planejamentosRepository.createPlanejamento(dados),
  );
  ipcMain.handle(
    CANAIS.planejamentosAtualizar,
    (_evento, id: string, idFicha: string, patch: PatchPlanejamento) =>
      planejamentosRepository.updatePlanejamento(id, idFicha, patch),
  );
  ipcMain.handle(CANAIS.planejamentosGerar, (_evento, id: string) => gerarSugestoesParaFicha(id));
  ipcMain.handle(CANAIS.planejamentosRemover, (_evento, id: string, idFicha: string) =>
    planejamentosRepository.deletePlanejamento(id, idFicha),
  );

  ipcMain.handle(CANAIS.planosTerapeuticosList, (_evento, idFicha: string) =>
    planosTerapeuticosRepository.listPlanosTerapeuticos(idFicha),
  );
  ipcMain.handle(CANAIS.planosTerapeuticosCriar, (_evento, idFicha: string, dataPlanejamento: string) =>
    planosTerapeuticosRepository.createPlanoTerapeutico(idFicha, dataPlanejamento),
  );
  ipcMain.handle(
    CANAIS.planosTerapeuticosAtualizar,
    (_evento, id: string, idFicha: string, patch: PatchPlanoTerapeutico) =>
      planosTerapeuticosRepository.updatePlanoTerapeutico(id, idFicha, patch),
  );
  ipcMain.handle(CANAIS.planosTerapeuticosGerar, (_evento, id: string) => gerarPlanoTerapeuticoParaFicha(id));
  ipcMain.handle(CANAIS.planosTerapeuticosRemover, (_evento, id: string, idFicha: string) =>
    planosTerapeuticosRepository.deletePlanoTerapeutico(id, idFicha),
  );

  ipcMain.handle(CANAIS.relatoriosAvaliativosList, (_evento, idFicha: string) =>
    relatoriosAvaliativosRepository.listRelatoriosAvaliativos(idFicha),
  );
  ipcMain.handle(
    CANAIS.relatoriosAvaliativosCriar,
    (_evento, idFicha: string, dataInicioAvaliacao: string | null) =>
      relatoriosAvaliativosRepository.createRelatorioAvaliativo(idFicha, null, dataInicioAvaliacao),
  );
  ipcMain.handle(
    CANAIS.relatoriosAvaliativosAtualizar,
    (_evento, id: string, idFicha: string, patch: PatchRelatorioAvaliativo) =>
      relatoriosAvaliativosRepository.updateRelatorioAvaliativo(id, idFicha, patch),
  );
  ipcMain.handle(CANAIS.relatoriosAvaliativosGerar, (_evento, id: string) => gerarRelatorioAvaliativoParaFicha(id));
  ipcMain.handle(CANAIS.relatoriosAvaliativosRemover, (_evento, id: string, idFicha: string) =>
    relatoriosAvaliativosRepository.deleteRelatorioAvaliativo(id, idFicha),
  );

  ipcMain.handle(
    CANAIS.anexosList,
    (_evento, idFicha: string, categoria: CategoriaAnexoPaciente) => anexosRepository.listAnexos(idFicha, categoria),
  );
  ipcMain.handle(
    CANAIS.anexosUpload,
    async (_evento, idFicha: string, categoria: CategoriaAnexoPaciente, nomePersonalizado: string | null) => {
      const arquivo = await escolherDocumento("Selecionar arquivo");
      if (!arquivo) return { cancelado: true };
      const anexo = anexosRepository.createAnexo({
        idFicha,
        categoria,
        nomePersonalizado,
        nomeArquivo: arquivo.nomeArquivo,
        mime: arquivo.mime,
        base64: arquivo.base64,
      });
      return { cancelado: false, anexo };
    },
  );
  ipcMain.handle(CANAIS.anexosRemover, (_evento, id: string, idFicha: string) =>
    anexosRepository.deleteAnexo(id, idFicha),
  );
  ipcMain.handle(CANAIS.anexosAbrir, (_evento, id: string) => {
    const anexo = anexosRepository.getAnexo(id);
    if (!anexo) throw new Error("Anexo não encontrado.");
    return abrirAnexo(anexo);
  });

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
