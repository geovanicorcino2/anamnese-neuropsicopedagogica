import type { Ficha, Perfil, RelatorioFinal } from "@core/db/types";

const VAZIO = "—";

export interface ConteudoRelatorioFinal {
  nomeCrianca: string;
  dataNascimento: string;
  escola: string;
  nomeProfissional: string;
  tituloProfissional: string;
  objetivoAlcancado: string;
  avaliacaoAtencao: string;
  avaliacaoMotivacao: string;
  avaliacaoInteracao: string;
  observacoesFinais: string;
  relatorioGerado: string;
  geradoEm: string;
}

export interface DadosRelatorioFinal {
  ficha: Ficha;
  perfil: Perfil;
  relatorio: RelatorioFinal;
}

export function montarConteudoRelatorioFinal(dados: DadosRelatorioFinal): ConteudoRelatorioFinal {
  return {
    nomeCrianca: dados.ficha.Nome_Crianca,
    dataNascimento: dados.ficha.Data_Nascimento ?? VAZIO,
    escola: dados.ficha.Escola ?? VAZIO,
    nomeProfissional: dados.perfil.Nome_Profissional,
    tituloProfissional: dados.perfil.Titulo,
    objetivoAlcancado: dados.relatorio.Objetivo_Alcancado ?? VAZIO,
    avaliacaoAtencao: dados.relatorio.Avaliacao_Atencao ?? VAZIO,
    avaliacaoMotivacao: dados.relatorio.Avaliacao_Motivacao ?? VAZIO,
    avaliacaoInteracao: dados.relatorio.Avaliacao_Interacao ?? VAZIO,
    observacoesFinais: dados.relatorio.Observacoes_Finais ?? "",
    relatorioGerado: dados.relatorio.Relatorio_Gerado ?? VAZIO,
    geradoEm: new Date().toISOString(),
  };
}
