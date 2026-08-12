// Lógica compartilhada de campos condicionais (campoDetalheId + valorGatilho): decide se um
// campo-detalhe deve aparecer no formulário, e calcula o progresso de uma seção tratando cada
// par (campo, campoDetalhe) como uma única unidade — em vez de dois campos independentes.
import type { CampoAnamnese, SecaoAnamnese } from "@core/data/anamneseSchema";

const SEPARADOR_MULTIPLA_ESCOLHA = ";";

export function valorAtingeGatilho(campo: CampoAnamnese, valor: string): boolean {
  if (!campo.valorGatilho || !valor) return false;
  if (campo.tipo === "multipla_escolha") {
    return valor.split(SEPARADOR_MULTIPLA_ESCOLHA).includes(campo.valorGatilho);
  }
  return valor === campo.valorGatilho;
}

// Um campo é "de detalhe" se algum outro campo da mesma seção aponta pra ele via campoDetalheId.
export function idsDeCamposDetalhe(campos: CampoAnamnese[]): Set<string> {
  return new Set(campos.filter((c) => c.campoDetalheId).map((c) => c.campoDetalheId as string));
}

// Usado pelo formulário: um campo-detalhe só deve ser exibido quando o campo-pai já atingiu o
// valorGatilho. Campos que não são detalhe de ninguém sempre aparecem.
export function campoDeveAparecer(
  campo: CampoAnamnese,
  camposDaSecao: CampoAnamnese[],
  valores: Record<string, string>,
): boolean {
  const pai = camposDaSecao.find((c) => c.campoDetalheId === campo.id);
  if (!pai) return true;
  return valorAtingeGatilho(pai, valores[pai.id] ?? "");
}

export function calcularProgressoSecao(secao: SecaoAnamnese, respostas: Map<string, string>): number {
  const campos = secao.campos.filter((c) => c.tipo !== "tabela_familiares");
  const detalheIds = idsDeCamposDetalhe(campos);
  const unidades = campos.filter((c) => !detalheIds.has(c.id));

  if (unidades.length === 0) return 100;

  let soma = 0;
  for (const campo of unidades) {
    const valor = (respostas.get(campo.id) ?? "").trim();
    if (!valor) continue;

    if (!campo.campoDetalheId) {
      soma += 1;
      continue;
    }

    if (!valorAtingeGatilho(campo, valor)) {
      soma += 1; // resposta principal não pede detalhe — unidade completa
      continue;
    }

    const valorDetalhe = (respostas.get(campo.campoDetalheId) ?? "").trim();
    soma += valorDetalhe ? 1 : 0.5;
  }

  return Math.round((soma / unidades.length) * 100);
}
