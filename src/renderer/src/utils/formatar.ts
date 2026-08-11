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
  const data = new Date(isoOuData);
  if (Number.isNaN(data.getTime())) return isoOuData;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
