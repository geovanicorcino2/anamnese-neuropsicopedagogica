export const SCHEMA_VERSAO_ATUAL = 1;

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
  Nome_Clinica TEXT NOT NULL
);
`;
