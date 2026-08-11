import { writeFileSync } from "node:fs";
import { gerarDocxAnamnese } from "../src/main/export/docxAnamneseBuilder";
import type { ConteudoFicha } from "../src/core/services/anamneseContent";
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
      .map((campo) => ({ rotulo: campo.rotulo, valor: "Valor de teste & <especial>" })),
  })),
  familiares: [
    { nome: "João Teste", idade: "10", relacao: "Irmão" },
    { nome: "Maria Avó", idade: "60", relacao: "Avó" },
  ],
  geradoEm: new Date().toISOString(),
};

gerarDocxAnamnese(conteudo).then((bytes) => {
  const caminho = "scratch/teste-anamnese.docx";
  writeFileSync(caminho, bytes);
  console.log(`Gerado: ${caminho} (${bytes.length} bytes)`);
});
