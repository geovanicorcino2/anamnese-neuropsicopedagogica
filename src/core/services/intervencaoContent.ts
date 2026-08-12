import type { Ficha, Perfil, SugestaoIA } from "@core/db/types";

const VAZIO = "—";

export interface ConteudoIntervencao {
  nomeCrianca: string;
  dataNascimento: string;
  escola: string;
  nomeProfissional: string;
  tituloProfissional: string;
  tempoSessao: string;
  atividades: string;
  objetivo: string;
  materiais: string;
  geradoEm: string;
}

export interface DadosIntervencao {
  ficha: Ficha;
  perfil: Perfil;
  sugestao: SugestaoIA;
}

export function montarConteudoIntervencao(dados: DadosIntervencao): ConteudoIntervencao {
  return {
    nomeCrianca: dados.ficha.Nome_Crianca,
    dataNascimento: dados.ficha.Data_Nascimento ?? VAZIO,
    escola: dados.ficha.Escola ?? VAZIO,
    nomeProfissional: dados.perfil.Nome_Profissional,
    tituloProfissional: dados.perfil.Titulo,
    tempoSessao: dados.sugestao.Tempo_Sessao ?? VAZIO,
    atividades: dados.sugestao.Atividades ?? VAZIO,
    objetivo: dados.sugestao.Objetivo_Gerado ?? VAZIO,
    materiais: dados.sugestao.Materiais_Gerado ?? VAZIO,
    geradoEm: new Date().toISOString(),
  };
}
