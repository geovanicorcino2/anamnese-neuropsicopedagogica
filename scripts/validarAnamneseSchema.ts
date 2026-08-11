import { ANAMNESE_SCHEMA, TODOS_CAMPOS } from "../src/core/data/anamneseSchema";
import { validarAnamneseSchema } from "../src/core/services/validarAnamneseSchema";

const erros = validarAnamneseSchema();

console.log(`Seções: ${ANAMNESE_SCHEMA.length} · Campos: ${TODOS_CAMPOS.length}`);

if (erros.length === 0) {
  console.log("OK — nenhum erro encontrado no schema da anamnese.");
  process.exit(0);
}

console.error(`\n${erros.length} erro(s) encontrado(s):\n`);
for (const erro of erros) {
  console.error(`  [${erro.tipo}] ${erro.mensagem}`);
}
process.exit(1);
