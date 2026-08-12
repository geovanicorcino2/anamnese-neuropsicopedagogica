export const SCHEMA_VERSAO_ATUAL = 2;

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
  Atualizado_Em TEXT NOT NULL
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
  IA_Url_Personalizada TEXT
);

CREATE TABLE IF NOT EXISTS SugestoesIA (
  ID_Ficha TEXT PRIMARY KEY REFERENCES Fichas(ID_Ficha) ON DELETE CASCADE,
  Texto TEXT NOT NULL,
  Gerado_Em TEXT NOT NULL
);
`;
