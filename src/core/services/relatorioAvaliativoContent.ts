import type { Familiar, Ficha, Perfil, RelatorioAvaliativo, RespostaFicha } from "@core/db/types";
import { juntarNomesResponsaveis } from "@core/services/anamneseContent";
import { resolverValorCampo } from "@core/services/anamneseModeloResolver";
import { calcularIdadeExtenso, formatarDataBR } from "@core/services/formatarData";

const VAZIO = "—";

export interface ConteudoRelatorioAvaliativo {
  nomeCrianca: string;
  idade: string;
  dataNascimento: string;
  serie: string;
  turno: string;
  escola: string;
  nomeResponsaveis: string;
  dataInicioAvaliacao: string;
  dataEncerramento: string;
  nomeProfissional: string;
  tituloProfissional: string;
  objetivoAvaliacao: string;
  historicoEscolarFamiliar: string;
  aspectosEmocionaisComportamentais: string;
  metodologiaAvaliacao: string;
  aspectosCognitivosAprendizagem: string;
  instrumentosUtilizados: string;
  resultadosAvaliacao: string;
  intervencoesAplicadas: string;
  recomendacoes: string;
  geradoEm: string;
}

export interface DadosRelatorioAvaliativo {
  ficha: Ficha;
  perfil: Perfil;
  familiares: Familiar[];
  respostas: RespostaFicha[];
  relatorio: RelatorioAvaliativo;
}

export function montarConteudoRelatorioAvaliativo(dados: DadosRelatorioAvaliativo): ConteudoRelatorioAvaliativo {
  const mapaRespostas = new Map(dados.respostas.map((r) => [r.ID_Campo, r.Valor]));
  const turno = resolverValorCampo("identificacao.turno", mapaRespostas) || VAZIO;

  return {
    nomeCrianca: dados.ficha.Nome_Crianca,
    idade: calcularIdadeExtenso(dados.ficha.Data_Nascimento),
    dataNascimento: formatarDataBR(dados.ficha.Data_Nascimento) || VAZIO,
    serie: dados.relatorio.Serie ?? VAZIO,
    turno,
    escola: dados.ficha.Escola ?? VAZIO,
    nomeResponsaveis: juntarNomesResponsaveis(dados.familiares),
    dataInicioAvaliacao: dados.relatorio.Data_Inicio_Avaliacao ?? VAZIO,
    dataEncerramento: dados.relatorio.Data_Encerramento ?? VAZIO,
    nomeProfissional: dados.perfil.Nome_Profissional,
    tituloProfissional: dados.perfil.Titulo,
    objetivoAvaliacao: dados.relatorio.Objetivo_Avaliacao ?? VAZIO,
    historicoEscolarFamiliar: dados.relatorio.Historico_Escolar_Familiar ?? VAZIO,
    aspectosEmocionaisComportamentais: dados.relatorio.Aspectos_Emocionais_Comportamentais ?? VAZIO,
    metodologiaAvaliacao: dados.relatorio.Metodologia_Avaliacao ?? VAZIO,
    aspectosCognitivosAprendizagem: dados.relatorio.Aspectos_Cognitivos_Aprendizagem ?? VAZIO,
    instrumentosUtilizados: dados.relatorio.Instrumentos_Utilizados ?? VAZIO,
    resultadosAvaliacao: dados.relatorio.Resultados_Avaliacao ?? VAZIO,
    intervencoesAplicadas: dados.relatorio.Intervencoes_Aplicadas ?? VAZIO,
    recomendacoes: dados.relatorio.Recomendacoes ?? VAZIO,
    geradoEm: new Date().toISOString(),
  };
}
