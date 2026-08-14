// "YYYY-MM-DD" sem horário é interpretado pelo Date() como UTC meia-noite — em fusos negativos
// (ex.: Brasil) isso rola um dia pra trás na exibição. Forçar meia-noite LOCAL evita o bug (mesmo
// ajuste já usado em src/renderer/src/utils/formatar.ts).
export function formatarDataBR(isoOuData: string | null | undefined): string {
  if (!isoOuData) return "";
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(isoOuData);
  const data = new Date(somenteData ? `${isoOuData}T00:00:00` : isoOuData);
  if (Number.isNaN(data.getTime())) return isoOuData;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// "4 anos e 7 meses" / "07 meses" (só meses quando tem menos de 1 ano) — formato usado no cabeçalho
// dos documentos reais (Plano Terapêutico/Relatório Avaliativo). Mesmo ajuste de fuso do
// formatarDataBR acima (meia-noite local, não UTC).
export function calcularIdadeExtenso(dataNascimento: string | null | undefined, referencia: Date = new Date()): string {
  if (!dataNascimento) return "—";
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(dataNascimento);
  const nascimento = new Date(somenteData ? `${dataNascimento}T00:00:00` : dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return "—";

  let anos = referencia.getFullYear() - nascimento.getFullYear();
  let meses = referencia.getMonth() - nascimento.getMonth();
  if (referencia.getDate() < nascimento.getDate()) meses -= 1;
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }
  if (anos < 0) return "—";

  const partes: string[] = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? "mês" : "meses"}`);
  return partes.length > 0 ? partes.join(" e ") : "menos de 1 mês";
}
