import type { SugestaoIA } from "@core/db/types";
import { executar, primeiro } from "@main/db/connection";
import { agoraIso } from "@main/db/repositories/helpers";

export function getSugestao(idFicha: string): SugestaoIA | undefined {
  return primeiro<SugestaoIA>("SELECT * FROM SugestoesIA WHERE ID_Ficha = ?", [idFicha]);
}

export interface EntradaSugestao {
  tempoSessao: string | null;
  atividades: string | null;
  observacoes: string | null;
}

// Salva os campos que o profissional preenche ANTES de gerar a sugestão. Cria a linha se ainda
// não existir (Texto/Gerado_Em ficam string vazia até a primeira geração de verdade — são
// NOT NULL por compatibilidade com o schema anterior, então nunca gravamos NULL neles).
export function salvarEntrada(idFicha: string, entrada: EntradaSugestao): SugestaoIA {
  executar(
    `INSERT INTO SugestoesIA (ID_Ficha, Texto, Gerado_Em, Tempo_Sessao, Atividades, Observacoes)
     VALUES (?, '', '', ?, ?, ?)
     ON CONFLICT(ID_Ficha) DO UPDATE SET
       Tempo_Sessao = excluded.Tempo_Sessao,
       Atividades = excluded.Atividades,
       Observacoes = excluded.Observacoes`,
    [idFicha, entrada.tempoSessao, entrada.atividades, entrada.observacoes],
  );
  return getSugestao(idFicha) as SugestaoIA;
}

export interface ResultadoSugestao {
  objetivoGerado: string;
  materiaisGerado: string;
}

export function salvarResultado(idFicha: string, resultado: ResultadoSugestao): SugestaoIA {
  const agora = agoraIso();
  const textoCombinado = `OBJETIVO:\n${resultado.objetivoGerado}\n\nMATERIAIS:\n${resultado.materiaisGerado}`;
  executar(
    `INSERT INTO SugestoesIA (ID_Ficha, Texto, Gerado_Em, Objetivo_Gerado, Materiais_Gerado)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(ID_Ficha) DO UPDATE SET
       Texto = excluded.Texto,
       Gerado_Em = excluded.Gerado_Em,
       Objetivo_Gerado = excluded.Objetivo_Gerado,
       Materiais_Gerado = excluded.Materiais_Gerado`,
    [idFicha, textoCombinado, agora, resultado.objetivoGerado, resultado.materiaisGerado],
  );
  return getSugestao(idFicha) as SugestaoIA;
}
