// Reprodução literal do texto do documento-modelo ANANMESES NEUROPSICOPEDAGOGA.docx (raiz do
// projeto) — cada seção abaixo bate 1:1 com a seção equivalente em `anamneseSchema.ts` (mesmo
// `secaoId`), na mesma ordem de campos. Usado pelos exportadores (docxAnamneseBuilder.ts,
// pdfHtmlTemplate.ts) pra gerar um documento com a MESMA disposição de texto do original, em vez
// da grade "Rótulo: Valor" genérica usada antes.
//
// Regras seguidas na transcrição:
// - Onde o original tem um campo de resposta livre (linha em branco, sem parênteses de opção),
//   o campo vira um segmento "campo" — mesmo que no app esse campo seja um "selecao"/dropdown; o
//   valor escolhido é só impresso como texto na lacuna, igual ficaria escrito à mão.
// - Onde o original tem parênteses de opção "(   ) texto", o campo vira segmentos "checkbox" —
//   um por opção, marcado quando o valor salvo bate com a opção.
// - Alguns campos de detalhe (campoDetalheId no schema, tipo "Qual"/"Detalhes") não têm uma
//   lacuna própria no documento original — a pergunta-gatilho é só uma linha com um único espaço
//   pra resposta. Nesses casos o campo de detalhe fica de fora da reprodução literal (continua
//   funcionando normalmente na tela de preenchimento do app, só não ganha uma linha própria no
//   documento exportado, porque o original não tem espaço reservado pra isso).
// - `\t` nos textos literais vira tabulação real no DOCX e um espaçamento equivalente no PDF.

export type SegmentoLinha =
  | { tipo: "texto"; texto: string; negrito?: boolean }
  | { tipo: "campo"; campoId: string }
  | { tipo: "campo_ficha"; campo: "nome" | "dataNascimento" | "escola" }
  | { tipo: "checkbox"; campoId: string; opcao: string; rotulo: string };

export interface LinhaModelo {
  segmentos: SegmentoLinha[];
  negrito?: boolean;
}

export interface SecaoModelo {
  secaoId: string;
  linhas: LinhaModelo[];
}

function t(texto: string, negrito?: boolean): SegmentoLinha {
  return { tipo: "texto", texto, negrito };
}
function c(campoId: string): SegmentoLinha {
  return { tipo: "campo", campoId };
}
function cf(campo: "nome" | "dataNascimento" | "escola"): SegmentoLinha {
  return { tipo: "campo_ficha", campo };
}
function cb(campoId: string, opcao: string, rotulo?: string): SegmentoLinha {
  return { tipo: "checkbox", campoId, opcao, rotulo: rotulo ?? opcao };
}
function linha(segmentos: SegmentoLinha[], negrito?: boolean): LinhaModelo {
  return { segmentos, negrito };
}

export const MODELO_ANAMNESE_ORIGINAL: SecaoModelo[] = [
  {
    secaoId: "identificacao",
    linhas: [
      linha([t("Nome: "), cf("nome")]),
      linha([
        t("Idade: "),
        c("identificacao.idade_anos"),
        t(" anos e "),
        c("identificacao.idade_meses"),
        t(" meses\t\tData de nascimento: "),
        cf("dataNascimento"),
      ]),
      linha([t("Natural de: "), c("identificacao.natural_de")]),
      linha([
        t("Escolaridade: "),
        c("identificacao.escolaridade"),
        t("\tTurno: "),
        c("identificacao.turno"),
        t(" Horário: "),
        c("identificacao.horario"),
      ]),
      linha([t("Escola: "), cf("escola")]),
      linha([
        cb("identificacao.publica_privada", "Pública"),
        t("\t\t"),
        cb("identificacao.publica_privada", "Privada"),
        t("          Fone: "),
        c("identificacao.escola_fone"),
      ]),
      linha([t("Professor(a) responsável: "), c("identificacao.professor_responsavel")]),
      linha([t("Coordenador(a): "), c("identificacao.coordenador")]),
      linha([
        t("Encaminhado pela escola:  "),
        cb("identificacao.encaminhado_pela_escola", "Sim", "sim"),
        t("\t"),
        cb("identificacao.encaminhado_pela_escola", "Não", "não"),
        t("   "),
        cb("identificacao.encaminhado_pela_escola", "Outro", "outro"),
        t(" "),
        c("identificacao.encaminhado_outro_detalhe"),
      ]),
      linha([t("Pai: ", true), c("identificacao.pai_nome"), t(" Idade: "), c("identificacao.pai_idade")]),
      linha([t("Fone: "), c("identificacao.pai_fone"), t(" Profissão: "), c("identificacao.pai_profissao")]),
      linha([t("Mãe: ", true), c("identificacao.mae_nome"), t(" Idade: "), c("identificacao.mae_idade")]),
      linha([t("Fone: "), c("identificacao.mae_fone"), t("  Profissão: "), c("identificacao.mae_profissao")]),
      linha([t("Endereço: ", true), c("identificacao.endereco")]),
      linha([t("Bairro: "), c("identificacao.bairro"), t(" Cidade: "), c("identificacao.cidade")]),
    ],
  },
  {
    secaoId: "composicao_familiar",
    linhas: [
      linha([t("Relação dos pais hoje? "), c("composicao_familiar.relacao_pais_hoje")]),
      linha([t("Outras crianças e parentes que moram com a criança:")]),
    ],
  },
  {
    secaoId: "identificacao_problema",
    linhas: [linha([t("Queixa (motivo): "), c("identificacao_problema.queixa_motivo")])],
  },
  {
    secaoId: "concepcao",
    linhas: [
      linha([
        cb("concepcao.filho_natural_adotivo", "Filho natural"),
        t("\t\t"),
        cb("concepcao.filho_natural_adotivo", "Filho adotivo"),
      ]),
      linha([
        t("Idade dos pais na época:  Pai: "),
        c("concepcao.idade_pai_epoca"),
        t("\tMãe: "),
        c("concepcao.idade_mae_epoca"),
      ]),
      linha([t("Gravidez foi planejada ou casual? "), c("concepcao.gravidez_planejada_casual")]),
      linha([t("Número de gestações anteriores? "), c("concepcao.numero_gestacoes_anteriores")]),
      linha([
        t("Abortos? "),
        cb("concepcao.abortos", "Sim", "sim"),
        t("\t"),
        cb("concepcao.abortos", "Não", "não"),
        t("    Naturais: "),
        cb("concepcao.abortos_naturais", "Sim", "sim"),
        t("\t"),
        cb("concepcao.abortos_naturais", "Não", "não"),
        t("   Provocados: "),
        cb("concepcao.abortos_provocados", "Sim", "sim"),
        t("  "),
        cb("concepcao.abortos_provocados", "Não", "não"),
      ]),
    ],
  },
  {
    secaoId: "gestacao",
    linhas: [
      linha([t("Acompanhamento pré-natal? "), c("gestacao.acompanhamento_prenatal")]),
      linha([t("Ingestão de algum tipo de drogas? Lícitas e/ou ilícitas? "), c("gestacao.ingestao_drogas")]),
      linha([t("Quedas ou acidentes durante a gestação? "), c("gestacao.quedas_acidentes")]),
      linha([t("Tomou alguma medicação? "), c("gestacao.medicacao")]),
      linha([
        t("Doenças: "),
        cb("gestacao.doencas", "Rubéola", "rubéola"),
        t("\t"),
        cb("gestacao.doencas", "Toxoplasmose", "toxoplasmose"),
        t("\t"),
        cb("gestacao.doencas", "Sífilis", "sífilis"),
        t("\t"),
        cb("gestacao.doencas", "Hipertensão", "hipertensão"),
        t(" "),
        cb("gestacao.doencas", "Diabetes", "diabetes"),
      ]),
      linha([cb("gestacao.doencas", "Outras", "outras"), t(" "), c("gestacao.doencas_outras_detalhe")]),
      linha([t("Condições emocionais? "), c("gestacao.condicoes_emocionais")]),
    ],
  },
  {
    secaoId: "parto",
    linhas: [
      linha([
        t("Parto: "),
        cb("parto.tipo", "Normal", "normal"),
        t("\t"),
        cb("parto.tipo", "Induzido", "induzido"),
        t("\t"),
        cb("parto.tipo", "Cesárea", "cesárea"),
      ]),
      linha([t("Cordão umbilical em volta do pescoço? "), c("parto.cordao_umbilical_pescoco")]),
      linha([t("Nasceu roxinho? "), c("parto.nasceu_roxinho"), t(" \tNecessitou de oxigênio? "), c("parto.necessitou_oxigenio")]),
      linha([t("Teve convulsões? "), c("parto.teve_convulsoes")]),
      linha([
        t("Altura: "),
        c("parto.altura"),
        t(" Peso: "),
        c("parto.peso"),
        t(" Teve icterícia? "),
        c("parto.teve_ictericia"),
      ]),
    ],
  },
  {
    secaoId: "alimentacao",
    linhas: [
      linha([t("Mamou no peito? "), c("alimentacao.mamou_peito"), t(" Tempo: "), c("alimentacao.mamou_peito_tempo")]),
      linha([t("Tomou mamadeira? "), c("alimentacao.tomou_mamadeira"), t(" Tempo: "), c("alimentacao.tomou_mamadeira_tempo")]),
      linha([t("Hoje tem hora para as refeições? "), c("alimentacao.hora_para_refeicoes")]),
      linha([
        t("Como a criança come? Rápido, devagar, sofreguidão, voracidade, mastiga bem? "),
        c("alimentacao.como_come"),
      ]),
      linha([
        t("Faz as refeições com a família? "),
        c("alimentacao.refeicoes_com_familia"),
        t(" Onde? Vendo TV? "),
        c("alimentacao.refeicoes_com_familia_detalhe"),
      ]),
      linha([t("Preferência alimentar: "), c("alimentacao.preferencia_alimentar")]),
    ],
  },
  {
    secaoId: "historia_clinica",
    linhas: [
      linha([t("Faz uso de medicação? "), c("historia_clinica.uso_medicacao")]),
      linha([t("Quais os acompanhamentos que faz na área da saúde? "), c("historia_clinica.acompanhamentos_saude")]),
    ],
  },
  {
    secaoId: "sono",
    linhas: [
      linha([t("Onde a criança dorme? Tem seu quarto? "), c("sono.onde_dorme")]),
      linha([t("Tem o costume de dormir na cama dos pais? "), c("sono.dorme_cama_pais")]),
      linha([t("Que horas dorme? "), c("sono.hora_dorme"), t(" Que horas acorda? "), c("sono.hora_acorda")]),
      linha([
        t("Sono: "),
        cb("sono.qualidade", "Tranquilo", "tranquilo"),
        t("  "),
        cb("sono.qualidade", "Agitado", "agitado"),
        t("  "),
        cb("sono.qualidade", "Range dentes", "range dentes"),
        t("  "),
        cb("sono.qualidade", "Terror noturno", "terror noturno"),
        t("  "),
        cb("sono.qualidade", "Sonambulismo", "sonambulismo"),
      ]),
      linha([
        cb("sono.fala_dormindo", "Sim", "Fala dormindo"),
        t(" Hábitos especiais (presença de alguém, objetos, embalo, bico, chupa dedo etc.): "),
        c("sono.habitos_especiais"),
      ]),
    ],
  },
  {
    secaoId: "desenvolvimento_psicomotor",
    linhas: [
      linha([
        t("Com que idade sentou? "),
        c("desenvolvimento_psicomotor.idade_sentou"),
        t(" Engatinhou? "),
        c("desenvolvimento_psicomotor.engatinhou"),
      ]),
      linha([t("Forma de engatinhar: "), c("desenvolvimento_psicomotor.forma_engatinhar")]),
      linha([
        t("Com que idade andou? "),
        c("desenvolvimento_psicomotor.idade_andou"),
        t(" Caía muito? "),
        c("desenvolvimento_psicomotor.caia_muito"),
        t(" Acredita que tenha alguma dificuldade motora? "),
        c("desenvolvimento_psicomotor.dificuldade_motora"),
      ]),
    ],
  },
  {
    secaoId: "controle_esfincteres",
    linhas: [
      linha([t("Com que idade parou de usar fraldas? "), c("controle_esfincteres.idade_parou_fraldas")]),
      linha([t("Controle esfincteriano: "), c("controle_esfincteres.controle")]),
    ],
  },
  {
    secaoId: "desenvolvimento_linguagem",
    linhas: [
      linha([
        t("Balbuciou? "),
        c("desenvolvimento_linguagem.balbuciou"),
        t(" Com que idade começou a falar? "),
        c("desenvolvimento_linguagem.idade_comecou_falar"),
      ]),
      linha([
        t("Fez uso de bico? "),
        c("desenvolvimento_linguagem.uso_bico"),
        t(" Até que idade? "),
        c("desenvolvimento_linguagem.uso_bico_ate_idade"),
      ]),
      linha([t("Compreende ordens? "), c("desenvolvimento_linguagem.compreende_ordens")]),
      linha([t("Como a criança se comunica? "), c("desenvolvimento_linguagem.como_se_comunica")]),
    ],
  },
  {
    secaoId: "escolaridade",
    linhas: [
      linha([t("Frequentou creches/educação infantil? "), c("escolaridade.frequentou_creche")]),
      linha([t("Idade que entrou para a escola: "), c("escolaridade.idade_entrou_escola")]),
      linha([t("Adaptação: "), c("escolaridade.adaptacao")]),
      linha([t("Repetiu de ano? "), c("escolaridade.repetiu_ano"), t(" Por quê? "), c("escolaridade.repetiu_ano_motivo")]),
      linha([t("Faz as tarefas sozinho(a)? "), c("escolaridade.faz_tarefas_sozinho")]),
      linha([t("Com quem faz as tarefas? "), c("escolaridade.com_quem_faz_tarefas")]),
      linha([t("Fatos importantes que aconteceram na vida escolar: "), c("escolaridade.fatos_importantes_vida_escolar")]),
      linha([t("Quais as queixas mais frequentes? "), c("escolaridade.queixas_frequentes")]),
      linha([t("Tem dificuldade para: ")], true),
      linha([
        cb("escolaridade.dificuldades", "Ler", "ler"),
        t("\t\t"),
        cb("escolaridade.dificuldades", "Escrever", "escrever"),
        t("\t"),
        cb("escolaridade.dificuldades", "Coordenação motora", "coordenação motora"),
        t("\t"),
        cb("escolaridade.dificuldades", "Contar", "contar"),
        t("\t"),
        cb("escolaridade.dificuldades", "Calcular", "calcular"),
      ]),
      linha([
        cb("escolaridade.dificuldades", "Esquece o que aprende", "esquece o que aprende"),
        t("\t"),
        cb("escolaridade.dificuldades", "Troca letras na escrita ou na leitura", "troca letras na escrita ou na leitura"),
        t("\t"),
        cb("escolaridade.dificuldades", "Letra ilegível", "letra ilegível"),
        t("   "),
        cb("escolaridade.dificuldades", "Atenção", "atenção"),
        t("\t"),
        cb("escolaridade.dificuldades", "Concentração", "concentração"),
      ]),
      linha([t("Conhece:")], true),
      linha([
        cb("escolaridade.conhecimentos_basicos", "Cores", "cores"),
        t("\t"),
        cb("escolaridade.conhecimentos_basicos", "Números", "números"),
        t("\t"),
        cb("escolaridade.conhecimentos_basicos", "Dinheiro", "dinheiro"),
        t("\t"),
        cb("escolaridade.conhecimentos_basicos", "Letras", "letras"),
        t("\t"),
        cb("escolaridade.conhecimentos_basicos", "Meses do ano", "meses do ano"),
        t("\t"),
        cb("escolaridade.conhecimentos_basicos", "Dias da semana", "dias da semana"),
      ]),
      linha([t("Sabe recortar? "), c("escolaridade.sabe_recortar"), t(" Como pega o lápis? "), c("escolaridade.como_pega_lapis")]),
      linha([t("Escreve muito forte ou muito fraco? "), c("escolaridade.escreve_forte_fraco")]),
    ],
  },
  {
    secaoId: "comportamento",
    linhas: [
      linha([t("Prefere brincar sozinho ou em grupos? "), c("comportamento.prefere_brincar")]),
      linha([t("Estranha mudanças de ambiente? "), c("comportamento.estranha_mudancas_ambiente")]),
      linha([t("Adapta-se facilmente ao meio? "), c("comportamento.adapta_facilmente_meio")]),
      linha([t("Aceita bem as ordens? "), c("comportamento.aceita_ordens")]),
      linha([t("Apresenta agressividade, apatia ou teimosia? "), c("comportamento.agressividade_apatia_teimosia")]),
      linha([t("Tem algum medo? "), c("comportamento.tem_medo")]),
      linha([t("Como a criança se comporta:")], true),
      linha([t("Em família: "), c("comportamento.em_familia")]),
      linha([t("Com outras pessoas: "), c("comportamento.com_outras_pessoas")]),
      linha([t("Com quem ela mais gosta de ficar e por quê? "), c("comportamento.com_quem_mais_gosta_ficar")]),
    ],
  },
  {
    secaoId: "visao",
    linhas: [
      linha([t("Algum problema? "), c("visao.problema")]),
      linha([t("Usa óculos? "), c("visao.usa_oculos")]),
      linha([t("Cirurgia? "), c("visao.cirurgia")]),
    ],
  },
  {
    secaoId: "audicao",
    linhas: [
      linha([t("Algum problema? "), c("audicao.problema")]),
      linha([t("Cirurgia? "), c("audicao.cirurgia")]),
      linha([t("Parece não ouvir quando é chamado? "), c("audicao.parece_nao_ouvir")]),
      linha([t("Já fez audiometria? "), c("audicao.fez_audiometria")]),
    ],
  },
  {
    secaoId: "habitos",
    linhas: [
      linha([t("Rói unha? "), c("habitos.roi_unha"), t(" Tem tiques nervosos? "), c("habitos.tiques_nervosos")]),
      linha([t("Alguma mania repetitiva? "), c("habitos.mania_repetitiva")]),
      linha([t("Chupa dedo ou bico? "), c("habitos.chupa_dedo_bico")]),
    ],
  },
  {
    secaoId: "relacionamento",
    linhas: [
      linha([t("Relaciona-se com outras crianças? "), c("relacionamento.relaciona_outras_criancas")]),
      linha([t("Tem amigos? Como é essa relação? "), c("relacionamento.tem_amigos")]),
      linha([t("Como é a relação na escola com colegas e professores? "), c("relacionamento.escola_colegas_professores")]),
      linha([t("Como é a relação na família com os pais e irmãos? "), c("relacionamento.familia_pais_irmaos")]),
    ],
  },
  {
    secaoId: "estimulacao",
    linhas: [
      linha([t("A criança tem acesso à: ")]),
      linha([
        cb("estimulacao.acesso_a", "Brinquedos", "Brinquedos"),
        t("\t"),
        cb("estimulacao.acesso_a", "Jogos pedagógicos", "jogos pedagógicos"),
        t(" "),
        cb("estimulacao.acesso_a", "Revistas, livros", "Revistas, livros"),
        t("\t"),
        cb("estimulacao.acesso_a", "Videogame", "Videogame"),
      ]),
      linha([
        cb("estimulacao.acesso_a", "Tablet", "Tablet"),
        t("\t"),
        cb("estimulacao.acesso_a", "Celular", "celular"),
        t("\t"),
        cb("estimulacao.acesso_a", "Computador", "Computador"),
      ]),
      linha([t("Como é o acesso aos eletrônicos? "), c("estimulacao.acesso_eletronicos_como")]),
      linha([t("É feito controle do conteúdo acessado na internet e redes sociais? "), c("estimulacao.controle_conteudo_internet")]),
    ],
  },
];
