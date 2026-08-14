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
  Registro_Profissional: string | null;
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

// Um registro por sessão de atendimento — substitui o antigo par SugestaoIA/RelatorioFinal
// (1 registro só por ficha) por histórico de verdade. Ver estado_atual_handoff (memória do
// projeto) pro porquê da fusão.
export interface PlanejamentoIntervencao {
  ID_Planejamento: string;
  ID_Ficha: string;
  Data_Sessao: string;
  Serie: string | null;
  Tempo_Sessao: string | null;
  Atividades: string | null;
  Objetivo_Gerado: string | null;
  Materiais_Gerado: string | null;
  Avaliacao_Atencao: string | null;
  Avaliacao_Motivacao: string | null;
  Avaliacao_Interacao: string | null;
  Objetivo_Sessao: string | null;
  Observacoes: string | null;
  Gerado_Em: string | null;
  Criado_Em: string;
}

// Plano Terapêutico Psicopedagógico — refeito a cada ~6 meses, histórico por ficha.
export interface PlanoTerapeutico {
  ID_Plano: string;
  ID_Ficha: string;
  Data_Planejamento: string;
  Diagnostico: string | null;
  Anamnese_Resumo: string | null;
  Protocolos_Avaliacao: string | null;
  Capacidades_Interesses: string | null;
  Necessidades: string | null;
  Metas_Prazos: string | null;
  Recursos_Estrategias: string | null;
  Treinamento_Parental: string | null;
  Profissionais_Acompanham: string | null;
  Frequencia_Atendimentos: string | null;
  Gerado_Em: string | null;
  Criado_Em: string;
}

// Relatório Avaliativo — relatório narrativo da evolução do paciente, histórico por ficha.
export interface RelatorioAvaliativo {
  ID_Relatorio: string;
  ID_Ficha: string;
  Serie: string | null;
  Data_Inicio_Avaliacao: string | null;
  Data_Encerramento: string | null;
  Objetivo_Avaliacao: string | null;
  Historico_Escolar_Familiar: string | null;
  Aspectos_Emocionais_Comportamentais: string | null;
  Metodologia_Avaliacao: string | null;
  Aspectos_Cognitivos_Aprendizagem: string | null;
  Instrumentos_Utilizados: string | null;
  Resultados_Avaliacao: string | null;
  Intervencoes_Aplicadas: string | null;
  Recomendacoes: string | null;
  Gerado_Em: string | null;
  Criado_Em: string;
}

export type CategoriaAnexoPaciente = "plano_terapeutico" | "relatorio_avaliativo" | "planejamento_intervencao";

// Arquivo arbitrário (PDF/DOC/DOCX/imagem) anexado a um paciente numa das 3 categorias novas —
// mesma estrutura de DocumentoMedico, só com Categoria fixa no lugar do Tipo livre.
export interface AnexoPaciente {
  ID_Anexo: string;
  ID_Ficha: string;
  Categoria: CategoriaAnexoPaciente;
  Nome_Personalizado: string | null;
  Nome_Arquivo: string;
  Mime: string;
  Base64: string;
  Criado_Em: string;
}
