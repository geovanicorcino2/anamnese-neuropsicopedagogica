export const SCHEMA_VERSAO_ATUAL = 5;

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
  Pasta_Backup TEXT
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
`;
