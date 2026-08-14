import type { Ficha, Perfil, PlanejamentoIntervencao } from "@core/db/types";
import { calcularIdadeExtenso, formatarDataBR } from "@core/services/formatarData";

const VAZIO = "—";

// Um "( ) Opção" por opção, "(X)" na selecionada — texto literal (não é checkbox nativo do Word),
// exatamente como no modelo real (PLANEJAMENTO INTERVENCAO_ALICE_SOPHIA). Compartilhado entre o
// builder DOCX e o template HTML/PDF — é geração de texto puro, sem marcação de formato nenhuma.
export function formatarLinhaOpcoes(opcoes: readonly string[], selecionado: string | null): string {
  return opcoes.map((opcao) => `(${opcao === selecionado ? "X" : " "}) ${opcao}`).join("    ");
}

export interface ConteudoPlanejamento {
  nomeCrianca: string;
  idade: string;
  serie: string;
  dataSessao: string;
  nomeProfissional: string;
  tituloProfissional: string;
  tempoSessaoSelecionado: string | null;
  atividades: string;
  objetivo: string;
  materiais: string;
  avaliacaoAtencaoSelecionada: string | null;
  avaliacaoMotivacaoSelecionada: string | null;
  avaliacaoInteracaoSelecionada: string | null;
  objetivoSessaoSelecionado: string | null;
  observacoes: string;
  geradoEm: string;
}

export interface DadosPlanejamento {
  ficha: Ficha;
  perfil: Perfil;
  planejamento: PlanejamentoIntervencao;
}

export function montarConteudoPlanejamento(dados: DadosPlanejamento): ConteudoPlanejamento {
  return {
    nomeCrianca: dados.ficha.Nome_Crianca,
    idade: calcularIdadeExtenso(dados.ficha.Data_Nascimento),
    serie: dados.planejamento.Serie ?? VAZIO,
    dataSessao: formatarDataBR(dados.planejamento.Data_Sessao) || VAZIO,
    nomeProfissional: dados.perfil.Nome_Profissional,
    tituloProfissional: dados.perfil.Titulo,
    tempoSessaoSelecionado: dados.planejamento.Tempo_Sessao,
    atividades: dados.planejamento.Atividades ?? VAZIO,
    objetivo: dados.planejamento.Objetivo_Gerado ?? VAZIO,
    materiais: dados.planejamento.Materiais_Gerado ?? VAZIO,
    avaliacaoAtencaoSelecionada: dados.planejamento.Avaliacao_Atencao,
    avaliacaoMotivacaoSelecionada: dados.planejamento.Avaliacao_Motivacao,
    avaliacaoInteracaoSelecionada: dados.planejamento.Avaliacao_Interacao,
    objetivoSessaoSelecionado: dados.planejamento.Objetivo_Sessao,
    observacoes: dados.planejamento.Observacoes ?? VAZIO,
    geradoEm: new Date().toISOString(),
  };
}
