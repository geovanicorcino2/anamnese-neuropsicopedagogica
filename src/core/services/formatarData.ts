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
