export type StatusFicha = "Rascunho" | "Concluída";

export interface Ficha {
  ID_Ficha: string;
  Nome_Crianca: string;
  Data_Nascimento: string | null;
  Escola: string | null;
  Status: StatusFicha;
  Criado_Em: string;
  Atualizado_Em: string;
}

export interface RespostaFicha {
  ID_Ficha: string;
  ID_Campo: string;
  Valor: string;
}

export interface Familiar {
  ID_Familiar: string;
  ID_Ficha: string;
  Nome: string;
  Idade: string | null;
  Relacao: string | null;
  Ordem: number;
}

export interface Perfil {
  ID_Perfil: string;
  Nome_Profissional: string;
  Titulo: string;
  Nome_Clinica: string;
}
