import { ANAMNESE_SCHEMA, TODOS_CAMPOS } from "@core/data/anamneseSchema";

export interface ErroValidacaoSchema {
  tipo: "id_duplicado" | "opcoes_vazias" | "detalhe_orfao" | "secao_vazia";
  mensagem: string;
}

export function validarAnamneseSchema(): ErroValidacaoSchema[] {
  const erros: ErroValidacaoSchema[] = [];
  const idsVistos = new Set<string>();

  for (const campo of TODOS_CAMPOS) {
    if (idsVistos.has(campo.id)) {
      erros.push({
        tipo: "id_duplicado",
        mensagem: `Campo com id duplicado: "${campo.id}"`,
      });
    }
    idsVistos.add(campo.id);

    if ((campo.tipo === "selecao" || campo.tipo === "multipla_escolha") && (!campo.opcoes || campo.opcoes.length === 0)) {
      erros.push({
        tipo: "opcoes_vazias",
        mensagem: `Campo "${campo.id}" é do tipo "${campo.tipo}" mas não tem opções.`,
      });
    }

    if (campo.campoDetalheId && !idsVistos.has(campo.campoDetalheId)) {
      const existeEmAlgumLugar = TODOS_CAMPOS.some((c) => c.id === campo.campoDetalheId);
      if (!existeEmAlgumLugar) {
        erros.push({
          tipo: "detalhe_orfao",
          mensagem: `Campo "${campo.id}" aponta campoDetalheId="${campo.campoDetalheId}", que não existe no schema.`,
        });
      }
    }
  }

  for (const secao of ANAMNESE_SCHEMA) {
    if (secao.campos.length === 0) {
      erros.push({
        tipo: "secao_vazia",
        mensagem: `Seção "${secao.id}" não tem nenhum campo.`,
      });
    }
  }

  return erros;
}
