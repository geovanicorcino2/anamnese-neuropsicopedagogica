import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MIGRACOES_V2, SCHEMA_SQL, SCHEMA_VERSAO_ATUAL } from "@core/db/schemaSql";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let db: Database | null = null;
let dbFilePath: string | null = null;

// sql.js fica externo ao bundle (externalizeDepsPlugin), então tanto em dev quanto
// empacotado o wasm é lido via node_modules real — o Electron sabe ler dentro do
// app.asar transparentemente; o arquivo também é desempacotado por segurança
// (ver "asarUnpack" no package.json).
function resolverCaminhoWasm(): string {
  return path.join(app.getAppPath(), "node_modules/sql.js/dist/sql-wasm.wasm");
}

function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ locateFile: () => resolverCaminhoWasm() });
  }
  return sqlJsPromise;
}

function caminhoArquivoBanco(): string {
  const pastaDados = app.getPath("userData");
  mkdirSync(pastaDados, { recursive: true });
  return path.join(pastaDados, "anamnese.db");
}

export async function abrirBanco(): Promise<Database> {
  if (db) return db;

  const SQL = await getSqlJs();
  dbFilePath = caminhoArquivoBanco();

  const bytesExistentes = existsSync(dbFilePath) ? readFileSync(dbFilePath) : undefined;
  db = bytesExistentes ? new SQL.Database(bytesExistentes) : new SQL.Database();
  db.run(SCHEMA_SQL);
  rodarMigracoes(db);
  persistirBanco();

  return db;
}

function versaoSchemaSalva(bancoAberto: Database): number {
  const stmt = bancoAberto.prepare("SELECT valor FROM Meta WHERE chave = 'schema_versao'");
  try {
    if (!stmt.step()) return 0;
    return Number(stmt.getAsObject().valor) || 0;
  } finally {
    stmt.free();
  }
}

// ALTER TABLE ADD COLUMN não tem "IF NOT EXISTS" no SQLite — cada statement roda dentro do
// próprio try/catch, então mesmo que a migração já tenha rodado antes (ou tenha rodado parcial),
// repetir não quebra o app.
function rodarMigracoes(bancoAberto: Database): void {
  const versaoAtual = versaoSchemaSalva(bancoAberto);
  if (versaoAtual >= SCHEMA_VERSAO_ATUAL) return;

  if (versaoAtual < 2) {
    for (const statement of MIGRACOES_V2) {
      try {
        bancoAberto.run(statement);
      } catch {
        // coluna já existe — segue o jogo.
      }
    }
  }

  bancoAberto.run(
    "INSERT INTO Meta (chave, valor) VALUES ('schema_versao', ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor",
    [String(SCHEMA_VERSAO_ATUAL)],
  );
}

export function persistirBanco(): void {
  if (!db || !dbFilePath) return;
  const bytes = db.export();
  writeFileSync(dbFilePath, Buffer.from(bytes));
}

function precisaEstarAberto(): Database {
  if (!db) {
    throw new Error("Banco de dados ainda não foi aberto — chame abrirBanco() antes.");
  }
  return db;
}

export function executar(sql: string, params: unknown[] = []): void {
  precisaEstarAberto().run(sql, params as never);
  persistirBanco();
}

export function todos<T>(sql: string, params: unknown[] = []): T[] {
  const stmt = precisaEstarAberto().prepare(sql);
  try {
    stmt.bind(params as never);
    const linhas: T[] = [];
    while (stmt.step()) {
      linhas.push(stmt.getAsObject() as T);
    }
    return linhas;
  } finally {
    stmt.free();
  }
}

export function primeiro<T>(sql: string, params: unknown[] = []): T | undefined {
  return todos<T>(sql, params)[0];
}
