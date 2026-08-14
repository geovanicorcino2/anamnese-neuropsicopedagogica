import { writeFileSync, readFileSync } from "node:fs";
import { gerarDocxAnamnese } from "../src/main/export/docxAnamneseBuilder";
import { gerarDocxIntervencao } from "../src/main/export/docxIntervencaoBuilder";
import { gerarDocxPlanoTerapeutico } from "../src/main/export/docxPlanoTerapeuticoBuilder";
import { gerarDocxRelatorioAvaliativo } from "../src/main/export/docxRelatorioAvaliativoBuilder";
import { montarConteudoFicha } from "../src/core/services/anamneseContent";
import { montarConteudoPlanejamento } from "../src/core/services/intervencaoContent";
import { montarConteudoPlanoTerapeutico } from "../src/core/services/planoTerapeuticoContent";
import { montarConteudoRelatorioAvaliativo } from "../src/core/services/relatorioAvaliativoContent";
import type { IdentidadeVisualConfig } from "../src/core/services/identidadeVisualConfig";
import { TODOS_CAMPOS } from "../src/core/data/anamneseSchema";
import type {
  Ficha,
  Perfil,
  RespostaFicha,
  Familiar,
  PlanejamentoIntervencao,
  PlanoTerapeutico,
  RelatorioAvaliativo,
} from "../src/core/db/types";

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
  Registro_Profissional: "CBO 2394-40",
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

// Texto propositalmente cheio de markdown (**negrito**, "# título", "---", listas com "-") —
// mesmo formato que a IA às vezes devolve apesar do prompt pedir texto simples. Reexercita o fix
// de paragrafoTextoIa desta sessão (sem isso, os símbolos apareciam literais no documento).
const textoIaComMarkdown = (rotulo: string): string =>
  `# ${rotulo}\n\n**Importante:** isto é uma sugestão para revisão do profissional.\n\n- item um\n- item dois\n\n---\n\nTexto corrido normal na sequência.`;

// 2 sessões — histórico de verdade, não só 1 registro (ver PlanejamentosIntervencao no schema).
const planejamentos: PlanejamentoIntervencao[] = [
  {
    ID_Planejamento: "pl1",
    ID_Ficha: ficha.ID_Ficha,
    Data_Sessao: "2024-07-01",
    Serie: "3º Ano",
    Tempo_Sessao: "20–40 min",
    Atividades: "Atividade de teste 1",
    Objetivo_Gerado: textoIaComMarkdown("Objetivo sessão 1"),
    Materiais_Gerado: textoIaComMarkdown("Materiais sessão 1"),
    Avaliacao_Atencao: "Boa",
    Avaliacao_Motivacao: "Alta",
    Avaliacao_Interacao: "Participativo",
    Objetivo_Sessao: "Objetivo alcançado",
    Observacoes: "Observação da sessão 1.",
    Gerado_Em: new Date().toISOString(),
    Criado_Em: new Date().toISOString(),
  },
  {
    ID_Planejamento: "pl2",
    ID_Ficha: ficha.ID_Ficha,
    Data_Sessao: "2024-07-15",
    Serie: "3º Ano",
    Tempo_Sessao: "Até 20 min",
    Atividades: "Atividade de teste 2",
    Objetivo_Gerado: textoIaComMarkdown("Objetivo sessão 2"),
    Materiais_Gerado: textoIaComMarkdown("Materiais sessão 2"),
    Avaliacao_Atencao: "Regular",
    Avaliacao_Motivacao: "Média",
    Avaliacao_Interacao: "Pouco participativo",
    Objetivo_Sessao: "Parcialmente alcançado",
    Observacoes: "Observação da sessão 2.",
    Gerado_Em: new Date().toISOString(),
    Criado_Em: new Date().toISOString(),
  },
];

const planosTerapeuticos: PlanoTerapeutico[] = [
  {
    ID_Plano: "plano1",
    ID_Ficha: ficha.ID_Ficha,
    Data_Planejamento: "2024-01-05",
    Diagnostico: textoIaComMarkdown("Diagnóstico"),
    Anamnese_Resumo: textoIaComMarkdown("Anamnese"),
    Protocolos_Avaliacao: textoIaComMarkdown("Protocolos"),
    Capacidades_Interesses: textoIaComMarkdown("Capacidades"),
    Necessidades: textoIaComMarkdown("Necessidades"),
    Metas_Prazos: textoIaComMarkdown("Metas"),
    Recursos_Estrategias: textoIaComMarkdown("Recursos"),
    Treinamento_Parental: textoIaComMarkdown("Treinamento parental"),
    Profissionais_Acompanham: "Neuropediatra e Neuropsicopedagoga.",
    Frequencia_Atendimentos: "Quartas e sextas-feiras, 50 minutos.",
    Gerado_Em: new Date().toISOString(),
    Criado_Em: new Date().toISOString(),
  },
  {
    ID_Plano: "plano2",
    ID_Ficha: ficha.ID_Ficha,
    Data_Planejamento: "2024-07-05",
    Diagnostico: textoIaComMarkdown("Diagnóstico (reavaliação)"),
    Anamnese_Resumo: textoIaComMarkdown("Anamnese (reavaliação)"),
    Protocolos_Avaliacao: textoIaComMarkdown("Protocolos (reavaliação)"),
    Capacidades_Interesses: textoIaComMarkdown("Capacidades (reavaliação)"),
    Necessidades: textoIaComMarkdown("Necessidades (reavaliação)"),
    Metas_Prazos: textoIaComMarkdown("Metas (reavaliação)"),
    Recursos_Estrategias: textoIaComMarkdown("Recursos (reavaliação)"),
    Treinamento_Parental: textoIaComMarkdown("Treinamento parental (reavaliação)"),
    Profissionais_Acompanham: "Neuropediatra e Neuropsicopedagoga.",
    Frequencia_Atendimentos: "Quartas e sextas-feiras, 50 minutos.",
    Gerado_Em: new Date().toISOString(),
    Criado_Em: new Date().toISOString(),
  },
];

const relatoriosAvaliativos: RelatorioAvaliativo[] = [
  {
    ID_Relatorio: "rel1",
    ID_Ficha: ficha.ID_Ficha,
    Serie: "Jardim II",
    Data_Inicio_Avaliacao: "Setembro 2023",
    Data_Encerramento: "Em intervenção",
    Objetivo_Avaliacao: textoIaComMarkdown("Objetivo da avaliação"),
    Historico_Escolar_Familiar: textoIaComMarkdown("Histórico escolar"),
    Aspectos_Emocionais_Comportamentais: textoIaComMarkdown("Aspectos emocionais"),
    Metodologia_Avaliacao: textoIaComMarkdown("Metodologia"),
    Aspectos_Cognitivos_Aprendizagem: textoIaComMarkdown("Aspectos cognitivos"),
    Instrumentos_Utilizados: textoIaComMarkdown("Instrumentos"),
    Resultados_Avaliacao: textoIaComMarkdown("Resultados"),
    Intervencoes_Aplicadas: textoIaComMarkdown("Intervenções"),
    Recomendacoes: textoIaComMarkdown("Recomendações"),
    Gerado_Em: new Date().toISOString(),
    Criado_Em: new Date().toISOString(),
  },
  {
    ID_Relatorio: "rel2",
    ID_Ficha: ficha.ID_Ficha,
    Serie: "1º Ano",
    Data_Inicio_Avaliacao: "Fevereiro 2024",
    Data_Encerramento: "Em intervenção",
    Objetivo_Avaliacao: textoIaComMarkdown("Objetivo da avaliação (2)"),
    Historico_Escolar_Familiar: textoIaComMarkdown("Histórico escolar (2)"),
    Aspectos_Emocionais_Comportamentais: textoIaComMarkdown("Aspectos emocionais (2)"),
    Metodologia_Avaliacao: textoIaComMarkdown("Metodologia (2)"),
    Aspectos_Cognitivos_Aprendizagem: textoIaComMarkdown("Aspectos cognitivos (2)"),
    Instrumentos_Utilizados: textoIaComMarkdown("Instrumentos (2)"),
    Resultados_Avaliacao: textoIaComMarkdown("Resultados (2)"),
    Intervencoes_Aplicadas: textoIaComMarkdown("Intervenções (2)"),
    Recomendacoes: textoIaComMarkdown("Recomendações (2)"),
    Gerado_Em: new Date().toISOString(),
    Criado_Em: new Date().toISOString(),
  },
];

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

  for (const [indice, planejamento] of planejamentos.entries()) {
    const conteudoPlanejamento = montarConteudoPlanejamento({ ficha, perfil, planejamento });
    const bytes = await gerarDocxIntervencao(conteudoPlanejamento, identidadePadrao);
    const caminho = `scratch/teste-planejamento-${indice + 1}.docx`;
    writeFileSync(caminho, bytes);
    console.log(`Gerado: ${caminho} (${bytes.length} bytes)`);
  }

  for (const [indice, plano] of planosTerapeuticos.entries()) {
    const conteudoPlano = montarConteudoPlanoTerapeutico({ ficha, perfil, familiares, plano });
    const bytes = await gerarDocxPlanoTerapeutico(conteudoPlano, identidadePadrao);
    const caminho = `scratch/teste-plano-terapeutico-${indice + 1}.docx`;
    writeFileSync(caminho, bytes);
    console.log(`Gerado: ${caminho} (${bytes.length} bytes)`);
  }

  for (const [indice, relatorio] of relatoriosAvaliativos.entries()) {
    const conteudoRelatorio = montarConteudoRelatorioAvaliativo({ ficha, perfil, familiares, respostas, relatorio });
    const bytes = await gerarDocxRelatorioAvaliativo(conteudoRelatorio, identidadePadrao);
    const caminho = `scratch/teste-relatorio-avaliativo-${indice + 1}.docx`;
    writeFileSync(caminho, bytes);
    console.log(`Gerado: ${caminho} (${bytes.length} bytes)`);
  }
}

main();
