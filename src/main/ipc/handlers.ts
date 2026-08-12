import { ipcMain } from "electron";
import { CANAIS } from "@main/ipc/channels";
import {
  familiaresRepository,
  fichasRepository,
  perfilRepository,
  respostasRepository,
  sugestoesRepository,
} from "@main/db";
import type { NovaFicha, PatchFicha } from "@main/db/repositories/fichasRepository";
import type { NovoFamiliar, PatchFamiliar } from "@main/db/repositories/familiaresRepository";
import type { PatchPerfil } from "@main/db/repositories/perfilRepository";
import { exportarFichaDocx, exportarFichaPdf } from "@main/export/exportarFicha";
import { escolherImagem } from "@main/perfil/uploadImagem";
import { gerarSugestoesParaFicha } from "@main/ia/gerarSugestoes";

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

  ipcMain.handle(CANAIS.iaGerarSugestoes, (_evento, idFicha: string) => gerarSugestoesParaFicha(idFicha));
  ipcMain.handle(CANAIS.iaObterSugestao, (_evento, idFicha: string) => sugestoesRepository.getSugestao(idFicha));
}
