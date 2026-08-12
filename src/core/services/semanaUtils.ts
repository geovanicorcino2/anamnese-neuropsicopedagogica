// Segunda-feira da semana que contém `data` (00:00 local). Date.getDay() retorna 0=domingo.
export function inicioDaSemana(data: Date): Date {
  const diaDaSemana = data.getDay();
  const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  const resultado = new Date(data);
  resultado.setDate(data.getDate() + diffParaSegunda);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

export function adicionarDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(data.getDate() + dias);
  return resultado;
}

// Segunda a domingo, a partir do início da semana.
export function gerarDiasDaSemana(inicio: Date): Date[] {
  return Array.from({ length: 7 }, (_, indice) => adicionarDias(inicio, indice));
}

// "YYYY-MM-DD" local — não usar toISOString() aqui, que é UTC e pode mudar o dia perto da
// meia-noite dependendo do fuso horário do usuário.
export function formatarDataIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
