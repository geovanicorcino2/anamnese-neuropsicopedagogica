import { randomUUID } from "node:crypto";
import { executar } from "@main/db/connection";

export function generateId(prefixo: string): string {
  return `${prefixo}_${randomUUID()}`;
}

export function agoraIso(): string {
  return new Date().toISOString();
}

export function buildUpdate<T extends object>(
  tabela: string,
  colunaId: string,
  id: string,
  patch: Partial<T>,
): { sql: string; params: unknown[] } {
  const chaves = Object.keys(patch).filter((chave) => (patch as Record<string, unknown>)[chave] !== undefined);
  const setClause = chaves.map((chave) => `${chave} = ?`).join(", ");
  const params = chaves.map((chave) => (patch as Record<string, unknown>)[chave]);
  params.push(id);

  return {
    sql: `UPDATE ${tabela} SET ${setClause} WHERE ${colunaId} = ?`,
    params,
  };
}

export function runUpdate<T extends object>(tabela: string, colunaId: string, id: string, patch: Partial<T>): void {
  const chaves = Object.keys(patch).filter((chave) => (patch as Record<string, unknown>)[chave] !== undefined);
  if (chaves.length === 0) return;
  const { sql, params } = buildUpdate<T>(tabela, colunaId, id, patch);
  executar(sql, params);
}
