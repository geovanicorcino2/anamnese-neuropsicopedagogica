import { encontrarCampo } from "@core/data/anamneseSchema";
import { SEPARADOR_MULTIPLA_ESCOLHA } from "@core/services/anamneseContent";
import { formatarDataBR } from "@core/services/formatarData";
import type { Ficha } from "@core/db/types";

// Lógica de resolução de valores do MODELO_ANAMNESE_ORIGINAL (anamneseModeloOriginal.ts) —
// compartilhada entre o builder DOCX e o template PDF/HTML, já que é só resolução de dado (não
// tem XML/HTML aqui dentro).

export function resolverValorCampo(campoId: string, respostas: Map<string, string>): string {
  const campo = encontrarCampo(campoId);
  const bruto = respostas.get(campoId);
  if (!bruto) return "";
  if (campo?.tipo === "multipla_escolha") {
    return bruto.split(SEPARADOR_MULTIPLA_ESCOLHA).filter(Boolean).join(", ");
  }
  return bruto;
}

export function opcaoEstaSelecionada(campoId: string, opcao: string, respostas: Map<string, string>): boolean {
  const campo = encontrarCampo(campoId);
  const bruto = respostas.get(campoId);
  if (!bruto) return false;
  if (campo?.tipo === "multipla_escolha") {
    return bruto.split(SEPARADOR_MULTIPLA_ESCOLHA).includes(opcao);
  }
  return bruto === opcao;
}

export function resolverCampoFicha(campo: "nome" | "dataNascimento" | "escola", ficha: Ficha): string {
  if (campo === "nome") return ficha.Nome_Crianca;
  if (campo === "dataNascimento") return formatarDataBR(ficha.Data_Nascimento);
  return ficha.Escola ?? "";
}
