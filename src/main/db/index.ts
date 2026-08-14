import { abrirBanco } from "@main/db/connection";
import { seedPerfilSeNecessario } from "@main/db/repositories/perfilRepository";

export async function iniciarBanco(): Promise<void> {
  await abrirBanco();
  seedPerfilSeNecessario();
}

export * as fichasRepository from "@main/db/repositories/fichasRepository";
export * as respostasRepository from "@main/db/repositories/respostasRepository";
export * as familiaresRepository from "@main/db/repositories/familiaresRepository";
export * as perfilRepository from "@main/db/repositories/perfilRepository";
export * as documentosRepository from "@main/db/repositories/documentosRepository";
export * as agendamentosRepository from "@main/db/repositories/agendamentosRepository";
export * as planejamentosRepository from "@main/db/repositories/planejamentosRepository";
export * as planosTerapeuticosRepository from "@main/db/repositories/planosTerapeuticosRepository";
export * as relatoriosAvaliativosRepository from "@main/db/repositories/relatoriosAvaliativosRepository";
export * as anexosRepository from "@main/db/repositories/anexosRepository";
