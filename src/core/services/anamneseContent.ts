import { ANAMNESE_SCHEMA, type TipoCampo } from "@core/data/anamneseSchema";
import type { Familiar, Ficha, Perfil, RespostaFicha } from "@core/db/types";
import { idsDeCamposDetalhe, valorAtingeGatilho } from "@core/services/progressoFicha";

const SEPARADOR_MULTIPLA_ESCOLHA = ";";
const VAZIO = "—";

export interface ItemConteudo {
  rotulo: string;
  valor: string;
  tipo: TipoCampo;
}

export interface SecaoConteudo {
  id: string;
  titulo: string;
  itens: ItemConteudo[];
}

export interface FamiliarConteudo {
  nome: string;
  idade: string;
  relacao: string;
}

export interface ConteudoFicha {
  nomeCrianca: string;
  dataNascimento: string;
  escola: string;
  status: string;
  nomeProfissional: string;
  tituloProfissional: string;
  nomeClinica: string;
  secoes: SecaoConteudo[];
  familiares: FamiliarConteudo[];
  geradoEm: string;
}

export interface DadosFicha {
  ficha: Ficha;
  perfil: Perfil;
  respostas: RespostaFicha[];
  familiares: Familiar[];
}

function formatarValor(tipo: string, valorBruto: string | undefined): string {
  if (!valorBruto) return VAZIO;

  if (tipo === "multipla_escolha") {
    const partes = valorBruto.split(SEPARADOR_MULTIPLA_ESCOLHA).filter(Boolean);
    return partes.length > 0 ? partes.join(", ") : VAZIO;
  }

  return valorBruto;
}

export function montarConteudoFicha(dados: DadosFicha): ConteudoFicha {
  const mapaRespostas = new Map(dados.respostas.map((r) => [r.ID_Campo, r.Valor]));

  const secoes: SecaoConteudo[] = ANAMNESE_SCHEMA.map((secao) => {
    const campos = secao.campos.filter((campo) => campo.tipo !== "tabela_familiares");
    const detalheIds = idsDeCamposDetalhe(campos);

    const itens = campos
      .filter((campo) => {
        // Detalhe vazio de um campo cuja resposta não pediu detalhe: omitir do relatório — é
        // exatamente o tipo de "informação duplicada/irrelevante" que o layout compacto evita.
        if (!detalheIds.has(campo.id)) return true;
        const pai = campos.find((c) => c.campoDetalheId === campo.id);
        const valor = mapaRespostas.get(campo.id);
        if (valor) return true;
        return !pai || valorAtingeGatilho(pai, mapaRespostas.get(pai.id) ?? "");
      })
      .map((campo) => ({
        rotulo: campo.rotulo,
        valor: formatarValor(campo.tipo, mapaRespostas.get(campo.id)),
        tipo: campo.tipo,
      }));

    return { id: secao.id, titulo: secao.titulo, itens };
  });

  return {
    nomeCrianca: dados.ficha.Nome_Crianca,
    dataNascimento: dados.ficha.Data_Nascimento ?? VAZIO,
    escola: dados.ficha.Escola ?? VAZIO,
    status: dados.ficha.Status,
    nomeProfissional: dados.perfil.Nome_Profissional,
    tituloProfissional: dados.perfil.Titulo,
    nomeClinica: dados.perfil.Nome_Clinica,
    secoes,
    familiares: dados.familiares.map((f) => ({
      nome: f.Nome,
      idade: f.Idade ?? VAZIO,
      relacao: f.Relacao ?? VAZIO,
    })),
    geradoEm: new Date().toISOString(),
  };
}
