import { writeFileSync, readFileSync } from "node:fs";
import { gerarDocxAnamnese } from "../src/main/export/docxAnamneseBuilder";
import { montarConteudoFicha } from "../src/core/services/anamneseContent";
import type { IdentidadeVisualConfig } from "../src/core/services/identidadeVisualConfig";
import { TODOS_CAMPOS } from "../src/core/data/anamneseSchema";
import type { Ficha, Perfil, RespostaFicha, Familiar } from "../src/core/db/types";

const ficha: Ficha = {
  ID_Ficha: "teste",
  Nome_Crianca: "Maria Teste da Silva",
  Data_Nascimento: "2018-05-10",
  Escola: "Escola Municipal Exemplo",
  Status: "Rascunho",
  Data_Inicio_Acompanhamento: "2024-01-01",
  Criado_Em: new Date().toISOString(),
  Atualizado_Em: new Date().toISOString(),
};

const perfil: Perfil = {
  ID_Perfil: "p1",
  Nome_Profissional: "Ana Paula de M. Gontijo",
  Titulo: "Neuropsicopedagoga Especialista em ABA",
  Nome_Clinica: "Humana Clínica de Saúde Integrada",
  Logo_Base64: null,
  Logo_Mime: null,
  Borda_Base64: null,
  Borda_Mime: null,
  IA_Provedor: null,
  IA_Chave: null,
  IA_Modelo: null,
  IA_Url_Personalizada: null,
  Pasta_Backup: null,
};

// Preenche todo campo com um valor plausível pro seu tipo — pros de opção fixa (selecao/sim_nao/
// multipla_escolha), usa opções de verdade pra exercitar o caminho de checkbox marcado.
const respostas: RespostaFicha[] = TODOS_CAMPOS.filter((campo) => campo.tipo !== "tabela_familiares").map((campo) => {
  let valor: string;
  if (campo.tipo === "sim_nao") {
    valor = "Sim";
  } else if (campo.tipo === "selecao" && campo.opcoes) {
    valor = campo.opcoes[0];
  } else if (campo.tipo === "multipla_escolha" && campo.opcoes) {
    valor = campo.opcoes.slice(0, 2).join(";");
  } else if (campo.tipo === "numero") {
    valor = "7";
  } else if (campo.tipo === "data") {
    valor = "2024-01-01";
  } else if (campo.tipo === "hora") {
    valor = "20:00";
  } else {
    valor = "Valor de teste & <especial>";
  }
  return { ID_Ficha: ficha.ID_Ficha, ID_Campo: campo.id, Valor: valor };
});

// Com pelo menos 1 familiar — ficha vazia (familiares: []) não exercita a tabela de composição
// familiar de verdade (só o parágrafo "Nenhum familiar cadastrado"), e já escondeu um bug real
// de XML malformado (</w:tblPr> faltando) que só aparecia com a tabela populada.
const familiares: Familiar[] = [
  { ID_Familiar: "f1", ID_Ficha: ficha.ID_Ficha, Nome: "João Teste", Idade: "10", Relacao: "Irmão", Ordem: 0 },
  { ID_Familiar: "f2", ID_Ficha: ficha.ID_Ficha, Nome: "Maria Avó", Idade: "60", Relacao: "Avó", Ordem: 1 },
];

const conteudo = montarConteudoFicha({ ficha, perfil, respostas, familiares });
const respostasMap = new Map(respostas.map((r) => [r.ID_Campo, r.Valor]));

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
  const bytesPadrao = await gerarDocxAnamnese(ficha, conteudo, respostasMap, identidadePadrao);
  writeFileSync("scratch/teste-anamnese-padrao.docx", bytesPadrao);
  console.log(
    `Gerado: scratch/teste-anamnese-padrao.docx (${bytesPadrao.length} bytes) — sem logo/borda customizados (usa fallback das 2 logos originais)`,
  );

  const bytesPersonalizado = await gerarDocxAnamnese(ficha, conteudo, respostasMap, identidadePersonalizada);
  writeFileSync("scratch/teste-anamnese-personalizado.docx", bytesPersonalizado);
  console.log(
    `Gerado: scratch/teste-anamnese-personalizado.docx (${bytesPersonalizado.length} bytes) — com logo/borda customizados`,
  );
}

main();
