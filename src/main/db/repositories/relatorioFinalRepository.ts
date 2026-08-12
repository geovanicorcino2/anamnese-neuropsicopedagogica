import type { RelatorioFinal } from "@core/db/types";
import { executar, primeiro } from "@main/db/connection";
import { agoraIso } from "@main/db/repositories/helpers";

export function getRelatorioFinal(idFicha: string): RelatorioFinal | undefined {
  return primeiro<RelatorioFinal>("SELECT * FROM RelatoriosFinais WHERE ID_Ficha = ?", [idFicha]);
}

export interface EntradaRelatorioFinal {
  objetivoAlcancado: string | null;
  avaliacaoAtencao: string | null;
  avaliacaoMotivacao: string | null;
  avaliacaoInteracao: string | null;
  observacoesFinais: string | null;
}

// Salva os campos que o profissional preenche ANTES de gerar o relatório final. Cria a linha se
// ainda não existir.
export function salvarEntrada(idFicha: string, entrada: EntradaRelatorioFinal): RelatorioFinal {
  executar(
    `INSERT INTO RelatoriosFinais (ID_Ficha, Objetivo_Alcancado, Avaliacao_Atencao, Avaliacao_Motivacao, Avaliacao_Interacao, Observacoes_Finais)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(ID_Ficha) DO UPDATE SET
       Objetivo_Alcancado = excluded.Objetivo_Alcancado,
       Avaliacao_Atencao = excluded.Avaliacao_Atencao,
       Avaliacao_Motivacao = excluded.Avaliacao_Motivacao,
       Avaliacao_Interacao = excluded.Avaliacao_Interacao,
       Observacoes_Finais = excluded.Observacoes_Finais`,
    [
      idFicha,
      entrada.objetivoAlcancado,
      entrada.avaliacaoAtencao,
      entrada.avaliacaoMotivacao,
      entrada.avaliacaoInteracao,
      entrada.observacoesFinais,
    ],
  );
  return getRelatorioFinal(idFicha) as RelatorioFinal;
}

export interface ResultadoRelatorioFinal {
  relatorioGerado: string;
}

export function salvarResultado(idFicha: string, resultado: ResultadoRelatorioFinal): RelatorioFinal {
  const agora = agoraIso();
  executar(
    `INSERT INTO RelatoriosFinais (ID_Ficha, Relatorio_Gerado, Gerado_Em)
     VALUES (?, ?, ?)
     ON CONFLICT(ID_Ficha) DO UPDATE SET
       Relatorio_Gerado = excluded.Relatorio_Gerado,
       Gerado_Em = excluded.Gerado_Em`,
    [idFicha, resultado.relatorioGerado, agora],
  );
  return getRelatorioFinal(idFicha) as RelatorioFinal;
}
