import type { Familiar, Ficha, Perfil, PlanoTerapeutico } from "@core/db/types";
import { juntarNomesResponsaveis } from "@core/services/anamneseContent";
import { calcularIdadeExtenso, formatarDataBR } from "@core/services/formatarData";

const VAZIO = "—";

export interface ConteudoPlanoTerapeutico {
  nomeCrianca: string;
  idade: string;
  nomeResponsaveis: string;
  dataNascimento: string;
  anoNascimento: string;
  dataPlanejamento: string;
  nomeProfissional: string;
  tituloProfissional: string;
  registroProfissional: string;
  diagnostico: string;
  anamneseResumo: string;
  protocolosAvaliacao: string;
  capacidadesInteresses: string;
  necessidades: string;
  metasPrazos: string;
  recursosEstrategias: string;
  treinamentoParental: string;
  profissionaisAcompanham: string;
  frequenciaAtendimentos: string;
  geradoEm: string;
}

export interface DadosPlanoTerapeutico {
  ficha: Ficha;
  perfil: Perfil;
  familiares: Familiar[];
  plano: PlanoTerapeutico;
}

export function montarConteudoPlanoTerapeutico(dados: DadosPlanoTerapeutico): ConteudoPlanoTerapeutico {
  const anoNascimento = dados.ficha.Data_Nascimento?.slice(0, 4) ?? VAZIO;

  return {
    nomeCrianca: dados.ficha.Nome_Crianca,
    idade: calcularIdadeExtenso(dados.ficha.Data_Nascimento),
    nomeResponsaveis: juntarNomesResponsaveis(dados.familiares),
    dataNascimento: formatarDataBR(dados.ficha.Data_Nascimento) || VAZIO,
    anoNascimento,
    dataPlanejamento: formatarDataBR(dados.plano.Data_Planejamento) || VAZIO,
    nomeProfissional: dados.perfil.Nome_Profissional,
    tituloProfissional: dados.perfil.Titulo,
    registroProfissional: dados.perfil.Registro_Profissional ?? "",
    diagnostico: dados.plano.Diagnostico ?? VAZIO,
    anamneseResumo: dados.plano.Anamnese_Resumo ?? VAZIO,
    protocolosAvaliacao: dados.plano.Protocolos_Avaliacao ?? VAZIO,
    capacidadesInteresses: dados.plano.Capacidades_Interesses ?? VAZIO,
    necessidades: dados.plano.Necessidades ?? VAZIO,
    metasPrazos: dados.plano.Metas_Prazos ?? VAZIO,
    recursosEstrategias: dados.plano.Recursos_Estrategias ?? VAZIO,
    treinamentoParental: dados.plano.Treinamento_Parental ?? VAZIO,
    profissionaisAcompanham: dados.plano.Profissionais_Acompanham ?? VAZIO,
    frequenciaAtendimentos: dados.plano.Frequencia_Atendimentos ?? VAZIO,
    geradoEm: new Date().toISOString(),
  };
}
