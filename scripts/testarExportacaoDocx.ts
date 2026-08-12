import { writeFileSync, readFileSync } from "node:fs";
import { gerarDocxAnamnese } from "../src/main/export/docxAnamneseBuilder";
import type { ConteudoFicha } from "../src/core/services/anamneseContent";
import type { IdentidadeVisualConfig } from "../src/core/services/identidadeVisualConfig";
import { ANAMNESE_SCHEMA } from "../src/core/data/anamneseSchema";

const conteudo: ConteudoFicha = {
  nomeCrianca: "Maria Teste da Silva",
  dataNascimento: "2018-05-10",
  escola: "Escola Municipal Exemplo",
  status: "Rascunho",
  nomeProfissional: "Ana Paula de M. Gontijo",
  tituloProfissional: "Neuropsicopedagoga Especialista em ABA",
  nomeClinica: "Humana Clínica de Saúde Integrada",
  secoes: ANAMNESE_SCHEMA.map((secao) => ({
    id: secao.id,
    titulo: secao.titulo,
    itens: secao.campos
      .filter((c) => c.tipo !== "tabela_familiares")
      .map((campo) => ({ rotulo: campo.rotulo, tipo: campo.tipo, valor: "Valor de teste & <especial>" })),
  })),
  familiares: [
    { nome: "João Teste", idade: "10", relacao: "Irmão" },
    { nome: "Maria Avó", idade: "60", relacao: "Avó" },
  ],
  geradoEm: new Date().toISOString(),
};

const identidadePadrao: IdentidadeVisualConfig = {
  logoBase64: null,
  logoMime: null,
  bordaBase64: null,
  bordaMime: null,
};

const logoBase64 = readFileSync("assets/identidade-visual/logo-ana-paula-neuropsicopedagoga.jpeg").toString("base64");
const bordaBase64 = readFileSync("assets/identidade-visual/logo-humana-clinica.png").toString("base64");

const identidadePersonalizada: IdentidadeVisualConfig = {
  logoBase64,
  logoMime: "image/jpeg",
  bordaBase64,
  bordaMime: "image/png",
};

async function main(): Promise<void> {
  const bytesPadrao = await gerarDocxAnamnese(conteudo, identidadePadrao);
  writeFileSync("scratch/teste-anamnese-padrao.docx", bytesPadrao);
  console.log(`Gerado: scratch/teste-anamnese-padrao.docx (${bytesPadrao.length} bytes) — sem logo/borda customizados`);

  const bytesPersonalizado = await gerarDocxAnamnese(conteudo, identidadePersonalizada);
  writeFileSync("scratch/teste-anamnese-personalizado.docx", bytesPersonalizado);
  console.log(
    `Gerado: scratch/teste-anamnese-personalizado.docx (${bytesPersonalizado.length} bytes) — com logo/borda customizados`,
  );
}

main();
