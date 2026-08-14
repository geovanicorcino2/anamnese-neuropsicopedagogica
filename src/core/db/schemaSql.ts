export const SCHEMA_VERSAO_ATUAL = 6;

// Colunas adicionadas depois da v1 (identidade visual configurável + config de IA em Perfil).
// Pra bancos já existentes, "ALTER TABLE Perfil ADD COLUMN" não tem "IF NOT EXISTS" — cada
// statement é executado dentro de um try/catch em main/db/connection.ts, então rodar de novo
// não quebra nada. Pra bancos novos, essas colunas já nascem na CREATE TABLE abaixo.
export const MIGRACOES_V2 = [
  "ALTER TABLE Perfil ADD COLUMN Logo_Base64 TEXT",
  "ALTER TABLE Perfil ADD COLUMN Logo_Mime TEXT",
  "ALTER TABLE Perfil ADD COLUMN Borda_Base64 TEXT",
  "ALTER TABLE Perfil ADD COLUMN Borda_Mime TEXT",
  "ALTER TABLE Perfil ADD COLUMN IA_Provedor TEXT",
  "ALTER TABLE Perfil ADD COLUMN IA_Chave TEXT",
  "ALTER TABLE Perfil ADD COLUMN IA_Modelo TEXT",
  "ALTER TABLE Perfil ADD COLUMN IA_Url_Personalizada TEXT",
];

// Pasta onde o app grava cópias de backup do próprio banco (ver src/main/backup/). Se o usuário
// apontar pra uma pasta sincronizada do OneDrive/Google Drive, o backup sobe pra nuvem sem o app
// precisar de login OAuth — quem sincroniza é o app deles, já logado na conta do usuário.
export const MIGRACOES_V3 = ["ALTER TABLE Perfil ADD COLUMN Pasta_Backup TEXT"];

// SugestoesIA passa a guardar os campos de entrada (preenchidos pelo profissional antes de gerar)
// separados dos campos gerados pela IA — Texto/Gerado_Em continuam existindo (NOT NULL) só por
// compatibilidade com o schema anterior; ficam string vazia até a primeira geração de verdade.
export const MIGRACOES_V4 = [
  "ALTER TABLE SugestoesIA ADD COLUMN Tempo_Sessao TEXT",
  "ALTER TABLE SugestoesIA ADD COLUMN Atividades TEXT",
  "ALTER TABLE SugestoesIA ADD COLUMN Observacoes TEXT",
  "ALTER TABLE SugestoesIA ADD COLUMN Objetivo_Gerado TEXT",
  "ALTER TABLE SugestoesIA ADD COLUMN Materiais_Gerado TEXT",
];

// Data em que o profissional começou a acompanhar o paciente (diferente de Criado_Em, que é
// quando a ficha foi cadastrada no app — o profissional pode registrar um acompanhamento antigo).
export const MIGRACOES_V5 = ["ALTER TABLE Fichas ADD COLUMN Data_Inicio_Acompanhamento TEXT"];

// Hub de Pacientes: Planejamento de Intervenção por sessão (substitui SugestoesIA/RelatoriosFinais
// — código antigo não é apagado, só deixa de ser referenciado, ver estado_atual_handoff), Plano
// Terapêutico e Relatório Avaliativo com histórico (N registros por ficha, chave própria — não
// PK = ID_Ficha como nas tabelas antigas), e anexos arbitrários (PDF/DOC/DOCX/imagem) por
// categoria. CREATE TABLE/CREATE INDEX já suportam "IF NOT EXISTS", então não precisam do
// try/catch por statement que ALTER TABLE ADD COLUMN exige.
export const MIGRACOES_V6 = [
  "ALTER TABLE Perfil ADD COLUMN Registro_Profissional TEXT",
  `CREATE TABLE IF NOT EXISTS PlanejamentosIntervencao (
    ID_Planejamento TEXT PRIMARY KEY,
    ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
    Data_Sessao TEXT NOT NULL,
    Serie TEXT,
    Tempo_Sessao TEXT,
    Atividades TEXT,
    Objetivo_Gerado TEXT,
    Materiais_Gerado TEXT,
    Avaliacao_Atencao TEXT,
    Avaliacao_Motivacao TEXT,
    Avaliacao_Interacao TEXT,
    Objetivo_Sessao TEXT,
    Observacoes TEXT,
    Gerado_Em TEXT,
    Criado_Em TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_planejamentos_ficha ON PlanejamentosIntervencao(ID_Ficha)",
  `CREATE TABLE IF NOT EXISTS PlanosTerapeuticos (
    ID_Plano TEXT PRIMARY KEY,
    ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
    Data_Planejamento TEXT NOT NULL,
    Diagnostico TEXT,
    Anamnese_Resumo TEXT,
    Protocolos_Avaliacao TEXT,
    Capacidades_Interesses TEXT,
    Necessidades TEXT,
    Metas_Prazos TEXT,
    Recursos_Estrategias TEXT,
    Treinamento_Parental TEXT,
    Profissionais_Acompanham TEXT,
    Frequencia_Atendimentos TEXT,
    Gerado_Em TEXT,
    Criado_Em TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_planos_ficha ON PlanosTerapeuticos(ID_Ficha)",
  `CREATE TABLE IF NOT EXISTS RelatoriosAvaliativos (
    ID_Relatorio TEXT PRIMARY KEY,
    ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
    Serie TEXT,
    Data_Inicio_Avaliacao TEXT,
    Data_Encerramento TEXT,
    Objetivo_Avaliacao TEXT,
    Historico_Escolar_Familiar TEXT,
    Aspectos_Emocionais_Comportamentais TEXT,
    Metodologia_Avaliacao TEXT,
    Aspectos_Cognitivos_Aprendizagem TEXT,
    Instrumentos_Utilizados TEXT,
    Resultados_Avaliacao TEXT,
    Intervencoes_Aplicadas TEXT,
    Recomendacoes TEXT,
    Gerado_Em TEXT,
    Criado_Em TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_relatorios_aval_ficha ON RelatoriosAvaliativos(ID_Ficha)",
  `CREATE TABLE IF NOT EXISTS AnexosPaciente (
    ID_Anexo TEXT PRIMARY KEY,
    ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
    Categoria TEXT NOT NULL,
    Nome_Personalizado TEXT,
    Nome_Arquivo TEXT NOT NULL,
    Mime TEXT NOT NULL,
    Base64 TEXT NOT NULL,
    Criado_Em TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_anexos_ficha ON AnexosPaciente(ID_Ficha)",
];

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS Meta (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Fichas (
  ID_Ficha TEXT PRIMARY KEY,
  Nome_Crianca TEXT NOT NULL,
  Data_Nascimento TEXT,
  Escola TEXT,
  Status TEXT NOT NULL DEFAULT 'Rascunho',
  Criado_Em TEXT NOT NULL,
  Atualizado_Em TEXT NOT NULL,
  Data_Inicio_Acompanhamento TEXT
);

CREATE TABLE IF NOT EXISTS RespostasFicha (
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  ID_Campo TEXT NOT NULL,
  Valor TEXT NOT NULL,
  PRIMARY KEY (ID_Ficha, ID_Campo)
);
CREATE INDEX IF NOT EXISTS idx_respostas_ficha ON RespostasFicha(ID_Ficha);

CREATE TABLE IF NOT EXISTS Familiares (
  ID_Familiar TEXT PRIMARY KEY,
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Nome TEXT NOT NULL,
  Idade TEXT,
  Relacao TEXT,
  Ordem INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_familiares_ficha ON Familiares(ID_Ficha);

CREATE TABLE IF NOT EXISTS Perfil (
  ID_Perfil TEXT PRIMARY KEY,
  Nome_Profissional TEXT NOT NULL,
  Titulo TEXT NOT NULL,
  Nome_Clinica TEXT NOT NULL,
  Logo_Base64 TEXT,
  Logo_Mime TEXT,
  Borda_Base64 TEXT,
  Borda_Mime TEXT,
  IA_Provedor TEXT,
  IA_Chave TEXT,
  IA_Modelo TEXT,
  IA_Url_Personalizada TEXT,
  Pasta_Backup TEXT,
  Registro_Profissional TEXT
);

CREATE TABLE IF NOT EXISTS SugestoesIA (
  ID_Ficha TEXT PRIMARY KEY REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Texto TEXT NOT NULL,
  Gerado_Em TEXT NOT NULL,
  Tempo_Sessao TEXT,
  Atividades TEXT,
  Observacoes TEXT,
  Objetivo_Gerado TEXT,
  Materiais_Gerado TEXT
);

CREATE TABLE IF NOT EXISTS RelatoriosFinais (
  ID_Ficha TEXT PRIMARY KEY REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Objetivo_Alcancado TEXT,
  Avaliacao_Atencao TEXT,
  Avaliacao_Motivacao TEXT,
  Avaliacao_Interacao TEXT,
  Observacoes_Finais TEXT,
  Relatorio_Gerado TEXT,
  Gerado_Em TEXT
);

CREATE TABLE IF NOT EXISTS Agendamentos (
  ID_Agendamento TEXT PRIMARY KEY,
  ID_Ficha TEXT REFERENCES Fichas(ID_Ficha) ON DELETE SET NULL,
  Nome_Paciente_Livre TEXT,
  Data TEXT NOT NULL,
  Hora_Inicio TEXT NOT NULL,
  Hora_Fim TEXT NOT NULL,
  Observacoes TEXT,
  Criado_Em TEXT NOT NULL,
  Atualizado_Em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON Agendamentos(Data);

CREATE TABLE IF NOT EXISTS DocumentosMedicos (
  ID_Documento TEXT PRIMARY KEY,
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Tipo TEXT NOT NULL,
  Nome_Personalizado TEXT,
  Nome_Arquivo TEXT NOT NULL,
  Mime TEXT NOT NULL,
  Base64 TEXT NOT NULL,
  Criado_Em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documentos_ficha ON DocumentosMedicos(ID_Ficha);

CREATE TABLE IF NOT EXISTS PlanejamentosIntervencao (
  ID_Planejamento TEXT PRIMARY KEY,
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Data_Sessao TEXT NOT NULL,
  Serie TEXT,
  Tempo_Sessao TEXT,
  Atividades TEXT,
  Objetivo_Gerado TEXT,
  Materiais_Gerado TEXT,
  Avaliacao_Atencao TEXT,
  Avaliacao_Motivacao TEXT,
  Avaliacao_Interacao TEXT,
  Objetivo_Sessao TEXT,
  Observacoes TEXT,
  Gerado_Em TEXT,
  Criado_Em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_planejamentos_ficha ON PlanejamentosIntervencao(ID_Ficha);

CREATE TABLE IF NOT EXISTS PlanosTerapeuticos (
  ID_Plano TEXT PRIMARY KEY,
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Data_Planejamento TEXT NOT NULL,
  Diagnostico TEXT,
  Anamnese_Resumo TEXT,
  Protocolos_Avaliacao TEXT,
  Capacidades_Interesses TEXT,
  Necessidades TEXT,
  Metas_Prazos TEXT,
  Recursos_Estrategias TEXT,
  Treinamento_Parental TEXT,
  Profissionais_Acompanham TEXT,
  Frequencia_Atendimentos TEXT,
  Gerado_Em TEXT,
  Criado_Em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_planos_ficha ON PlanosTerapeuticos(ID_Ficha);

CREATE TABLE IF NOT EXISTS RelatoriosAvaliativos (
  ID_Relatorio TEXT PRIMARY KEY,
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Serie TEXT,
  Data_Inicio_Avaliacao TEXT,
  Data_Encerramento TEXT,
  Objetivo_Avaliacao TEXT,
  Historico_Escolar_Familiar TEXT,
  Aspectos_Emocionais_Comportamentais TEXT,
  Metodologia_Avaliacao TEXT,
  Aspectos_Cognitivos_Aprendizagem TEXT,
  Instrumentos_Utilizados TEXT,
  Resultados_Avaliacao TEXT,
  Intervencoes_Aplicadas TEXT,
  Recomendacoes TEXT,
  Gerado_Em TEXT,
  Criado_Em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_relatorios_aval_ficha ON RelatoriosAvaliativos(ID_Ficha);

CREATE TABLE IF NOT EXISTS AnexosPaciente (
  ID_Anexo TEXT PRIMARY KEY,
  ID_Ficha TEXT NOT NULL REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Categoria TEXT NOT NULL,
  Nome_Personalizado TEXT,
  Nome_Arquivo TEXT NOT NULL,
  Mime TEXT NOT NULL,
  Base64 TEXT NOT NULL,
  Criado_Em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anexos_ficha ON AnexosPaciente(ID_Ficha);
`;
