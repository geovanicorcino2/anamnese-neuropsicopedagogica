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
export * as sugestoesRepository from "@main/db/repositories/sugestoesRepository";
