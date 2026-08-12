export function formatarDataHora(isoOuData: string | null | undefined): string {
  if (!isoOuData) return "—";
  const data = new Date(isoOuData);
  if (Number.isNaN(data.getTime())) return isoOuData;
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarData(isoOuData: string | null | undefined): string {
  if (!isoOuData) return "—";
  // "YYYY-MM-DD" sem horário é interpretado pelo Date() como UTC meia-noite — em fusos negativos
  // (ex.: Brasil) isso rolava um dia pra trás na exibição. Forçar meia-noite LOCAL evita o bug.
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(isoOuData);
  const data = new Date(somenteData ? `${isoOuData}T00:00:00` : isoOuData);
  if (Number.isNaN(data.getTime())) return isoOuData;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
