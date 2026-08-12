import type { Agendamento } from "@core/db/types";
import { executar, primeiro, todos } from "@main/db/connection";
import { agoraIso, generateId } from "@main/db/repositories/helpers";

export function listPorIntervalo(dataInicio: string, dataFim: string): Agendamento[] {
  return todos<Agendamento>(
    "SELECT * FROM Agendamentos WHERE Data BETWEEN ? AND ? ORDER BY Data ASC, Hora_Inicio ASC",
    [dataInicio, dataFim],
  );
}

export interface NovoAgendamento {
  idFicha?: string | null;
  nomePacienteLivre?: string | null;
  data: string;
  horaInicio: string;
  horaFim: string;
  observacoes?: string | null;
}

export function createAgendamento(dados: NovoAgendamento): Agendamento {
  const id = generateId("agendamento");
  const agora = agoraIso();

  executar(
    `INSERT INTO Agendamentos (ID_Agendamento, ID_Ficha, Nome_Paciente_Livre, Data, Hora_Inicio, Hora_Fim, Observacoes, Criado_Em, Atualizado_Em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      dados.idFicha ?? null,
      dados.nomePacienteLivre ?? null,
      dados.data,
      dados.horaInicio,
      dados.horaFim,
      dados.observacoes ?? null,
      agora,
      agora,
    ],
  );

  return primeiro<Agendamento>("SELECT * FROM Agendamentos WHERE ID_Agendamento = ?", [id]) as Agendamento;
}

export function deleteAgendamento(id: string): void {
  executar("DELETE FROM Agendamentos WHERE ID_Agendamento = ?", [id]);
}
