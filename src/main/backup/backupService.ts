import { dialog } from "electron";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Perfil } from "@core/db/types";
import { caminhoDoBancoAtual } from "@main/db/connection";
import { perfilRepository } from "@main/db";

const NOME_PASTA_APP = "Anamnese Neuropsicopedagógica";
const NOME_SUBPASTA = "Backups";
const PREFIXO_ARQUIVO = "anamnese-backup-";

export interface PastaNuvemDetectada {
  provedor: "onedrive" | "googledrive";
  caminho: string;
}

export interface ArquivoBackup {
  nome: string;
  caminho: string;
  tamanho: number;
  modificadoEm: string;
}

function detectarOneDrive(): string | null {
  const candidatos = [process.env["OneDrive"], process.env["OneDriveConsumer"], process.env["OneDriveCommercial"]];
  for (const candidato of candidatos) {
    if (candidato && existsSync(candidato)) return candidato;
  }
  return null;
}

// Não existe variável de ambiente padrão pro Google Drive. "Meu Drive"/"My Drive" é o nome que o
// Drive for Desktop usa dentro da letra de unidade que ele monta no modo padrão ("stream"); a
// pasta direto em %USERPROFILE%\Google Drive é do modo antigo (espelhamento). Best-effort — se
// não achar nada, o usuário sempre pode escolher a pasta manualmente.
function detectarGoogleDrive(): string | null {
  const legado = path.join(os.homedir(), "Google Drive");
  if (existsSync(legado)) return legado;

  for (let codigo = "D".charCodeAt(0); codigo <= "Z".charCodeAt(0); codigo++) {
    const letra = String.fromCharCode(codigo);
    for (const nomePasta of ["My Drive", "Meu Drive"]) {
      const candidato = `${letra}:\\${nomePasta}`;
      if (existsSync(candidato)) return candidato;
    }
  }
  return null;
}

export function detectarPastasNuvem(): PastaNuvemDetectada[] {
  const resultado: PastaNuvemDetectada[] = [];
  const oneDrive = detectarOneDrive();
  if (oneDrive) resultado.push({ provedor: "onedrive", caminho: oneDrive });
  const googleDrive = detectarGoogleDrive();
  if (googleDrive) resultado.push({ provedor: "googledrive", caminho: googleDrive });
  return resultado;
}

function definirPastaBackup(pastaBase: string): Perfil | undefined {
  const pastaFinal = path.join(pastaBase, NOME_PASTA_APP, NOME_SUBPASTA);
  mkdirSync(pastaFinal, { recursive: true });
  perfilRepository.updatePerfil({ Pasta_Backup: pastaFinal });
  return perfilRepository.getPerfil();
}

export function usarPastaDetectada(provedor: "onedrive" | "googledrive"): Perfil | undefined {
  const encontrada = detectarPastasNuvem().find((d) => d.provedor === provedor);
  if (!encontrada) {
    throw new Error("Não foi possível detectar essa pasta novamente — tente escolher manualmente.");
  }
  return definirPastaBackup(encontrada.caminho);
}

export async function escolherPastaManual(): Promise<Perfil | undefined | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Escolher pasta de backup",
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) return null;
  return definirPastaBackup(filePaths[0]);
}

export function removerPastaBackup(): Perfil | undefined {
  perfilRepository.updatePerfil({ Pasta_Backup: null });
  return perfilRepository.getPerfil();
}

function timestampArquivo(): string {
  const agora = new Date();
  const dois = (n: number): string => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}-${dois(agora.getHours())}${dois(agora.getMinutes())}${dois(agora.getSeconds())}`;
}

export function fazerBackupAgora(): ArquivoBackup {
  const perfil = perfilRepository.getPerfil();
  if (!perfil?.Pasta_Backup) {
    throw new Error("Nenhuma pasta de backup configurada ainda.");
  }

  const origem = caminhoDoBancoAtual();
  const nome = `${PREFIXO_ARQUIVO}${timestampArquivo()}.db`;
  const destino = path.join(perfil.Pasta_Backup, nome);
  copyFileSync(origem, destino);

  const info = statSync(destino);
  return { nome, caminho: destino, tamanho: info.size, modificadoEm: info.mtime.toISOString() };
}

// Usado pelo hook de before-quit — mesma lógica de fazerBackupAgora, mas silenciosa (não lança
// se não houver pasta configurada, já que backup automático é opcional).
export function fazerBackupSilencioso(): void {
  const perfil = perfilRepository.getPerfil();
  if (!perfil?.Pasta_Backup) return;
  try {
    fazerBackupAgora();
  } catch {
    // não bloqueia o fechamento do app por causa de um backup que falhou.
  }
}

export function listarBackups(): ArquivoBackup[] {
  const perfil = perfilRepository.getPerfil();
  if (!perfil?.Pasta_Backup || !existsSync(perfil.Pasta_Backup)) return [];

  const pasta = perfil.Pasta_Backup;
  return readdirSync(pasta)
    .filter((nome) => nome.startsWith(PREFIXO_ARQUIVO) && nome.endsWith(".db"))
    .map((nome) => {
      const caminho = path.join(pasta, nome);
      const info = statSync(caminho);
      return { nome, caminho, tamanho: info.size, modificadoEm: info.mtime.toISOString() };
    })
    .sort((a, b) => b.modificadoEm.localeCompare(a.modificadoEm));
}

export function restaurarBackup(caminhoBackup: string): void {
  if (!existsSync(caminhoBackup)) {
    throw new Error("Arquivo de backup não encontrado.");
  }
  copyFileSync(caminhoBackup, caminhoDoBancoAtual());
}

export async function restaurarBackupViaDialogo(): Promise<boolean> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Escolher arquivo de backup para restaurar",
    properties: ["openFile"],
    filters: [{ name: "Banco de dados da Anamnese", extensions: ["db"] }],
  });
  if (canceled || filePaths.length === 0) return false;
  restaurarBackup(filePaths[0]);
  return true;
}
