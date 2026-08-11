import type { RespostaFicha } from "@core/db/types";
import { executar, todos } from "@main/db/connection";
import { touchFicha } from "@main/db/repositories/fichasRepository";

export function listRespostas(idFicha: string): RespostaFicha[] {
  return todos<RespostaFicha>("SELECT * FROM RespostasFicha WHERE ID_Ficha = ?", [idFicha]);
}

export function salvarResposta(idFicha: string, idCampo: string, valor: string): void {
  executar(
    `INSERT INTO RespostasFicha (ID_Ficha, ID_Campo, Valor) VALUES (?, ?, ?)
     ON CONFLICT(ID_Ficha, ID_Campo) DO UPDATE SET Valor = excluded.Valor`,
    [idFicha, idCampo, valor],
  );
  touchFicha(idFicha);
}

export function removerResposta(idFicha: string, idCampo: string): void {
  executar("DELETE FROM RespostasFicha WHERE ID_Ficha = ? AND ID_Campo = ?", [idFicha, idCampo]);
  touchFicha(idFicha);
}

export function salvarRespostasEmLote(idFicha: string, respostas: Array<{ idCampo: string; valor: string }>): void {
  for (const { idCampo, valor } of respostas) {
    executar(
      `INSERT INTO RespostasFicha (ID_Ficha, ID_Campo, Valor) VALUES (?, ?, ?)
       ON CONFLICT(ID_Ficha, ID_Campo) DO UPDATE SET Valor = excluded.Valor`,
      [idFicha, idCampo, valor],
    );
  }
  touchFicha(idFicha);
}
