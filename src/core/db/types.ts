export type StatusFicha = "Rascunho" | "Concluída";

export interface Ficha {
  ID_Ficha: string;
  Nome_Crianca: string;
  Data_Nascimento: string | null;
  Escola: string | null;
  Status: StatusFicha;
  Criado_Em: string;
  Atualizado_Em: string;
  Data_Inicio_Acompanhamento: string | null;
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

export type ProvedorIA = "anthropic" | "openai" | "gemini" | "personalizado";

export interface Perfil {
  ID_Perfil: string;
  Nome_Profissional: string;
  Titulo: string;
  Nome_Clinica: string;
  Logo_Base64: string | null;
  Logo_Mime: string | null;
  Borda_Base64: string | null;
  Borda_Mime: string | null;
  IA_Provedor: ProvedorIA | null;
  IA_Chave: string | null;
  IA_Modelo: string | null;
  IA_Url_Personalizada: string | null;
  Pasta_Backup: string | null;
}

export interface SugestaoIA {
  ID_Ficha: string;
  Texto: string;
  Gerado_Em: string;
  Tempo_Sessao: string | null;
  Atividades: string | null;
  Observacoes: string | null;
  Objetivo_Gerado: string | null;
  Materiais_Gerado: string | null;
}

export interface RelatorioFinal {
  ID_Ficha: string;
  Objetivo_Alcancado: string | null;
  Avaliacao_Atencao: string | null;
  Avaliacao_Motivacao: string | null;
  Avaliacao_Interacao: string | null;
  Observacoes_Finais: string | null;
  Relatorio_Gerado: string | null;
  Gerado_Em: string | null;
}

export interface Agendamento {
  ID_Agendamento: string;
  ID_Ficha: string | null;
  Nome_Paciente_Livre: string | null;
  Data: string;
  Hora_Inicio: string;
  Hora_Fim: string;
  Observacoes: string | null;
  Criado_Em: string;
  Atualizado_Em: string;
}

export interface DocumentoMedico {
  ID_Documento: string;
  ID_Ficha: string;
  Tipo: string;
  Nome_Personalizado: string | null;
  Nome_Arquivo: string;
  Mime: string;
  Base64: string;
  Criado_Em: string;
}
