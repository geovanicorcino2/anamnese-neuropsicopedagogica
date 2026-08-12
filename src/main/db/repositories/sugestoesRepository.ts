import type { SugestaoIA } from "@core/db/types";
import { executar, primeiro } from "@main/db/connection";
import { agoraIso } from "@main/db/repositories/helpers";

export function getSugestao(idFicha: string): SugestaoIA | undefined {
  return primeiro<SugestaoIA>("SELECT * FROM SugestoesIA WHERE ID_Ficha = ?", [idFicha]);
}

export function salvarSugestao(idFicha: string, texto: string): SugestaoIA {
  executar(
    `INSERT INTO SugestoesIA (ID_Ficha, Texto, Gerado_Em) VALUES (?, ?, ?)
     ON CONFLICT(ID_Ficha) DO UPDATE SET Texto = excluded.Texto, Gerado_Em = excluded.Gerado_Em`,
    [idFicha, texto, agoraIso()],
  );
  return getSugestao(idFicha) as SugestaoIA;
}
