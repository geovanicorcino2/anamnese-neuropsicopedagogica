// Schema estático dos campos da ficha de anamnese, replicando 1:1 as 19 seções do
// documento ANANMESES NEUROPSICOPEDAGOGA.docx. Ver anamnese_form_field_classification.md
// (memória do projeto) para a classificação original de cada pergunta.
//
// Diferente do banco de perguntas do app de perícia, este schema NÃO é semeado no banco:
// é um único formulário fixo, então fica em código. Rode `npm run validar-schema` depois
// de qualquer alteração aqui.

export type TipoCampo =
  | "texto"
  | "texto_longo"
  | "numero"
  | "data"
  | "hora"
  | "sim_nao"
  | "selecao"
  | "multipla_escolha"
  | "tabela_familiares";

export interface CampoAnamnese {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes?: string[];
  campoDetalheId?: string;
  // Valor que faz o campo apontado por campoDetalheId passar a ser relevante — pra "selecao"/
  // "sim_nao" precisa bater exatamente; pra "multipla_escolha" precisa estar entre as opções
  // selecionadas. Sem campoDetalheId, este campo não tem efeito.
  valorGatilho?: string;
  obrigatorio?: boolean;
}

export interface SecaoAnamnese {
  id: string;
  titulo: string;
  campos: CampoAnamnese[];
}

export const ANAMNESE_SCHEMA: SecaoAnamnese[] = [
  {
    id: "identificacao",
    titulo: "Identificação",
    campos: [
      // Nome, data de nascimento e escola NÃO ficam aqui — já são colunas da própria ficha
      // (preenchidas na criação, tabela Fichas) e apareciam duplicadas (sempre vazias) aqui.
      { id: "identificacao.idade_anos", rotulo: "Idade (anos)", tipo: "numero" },
      { id: "identificacao.idade_meses", rotulo: "Idade (meses)", tipo: "numero" },
      { id: "identificacao.natural_de", rotulo: "Natural de", tipo: "texto" },
      { id: "identificacao.escolaridade", rotulo: "Escolaridade", tipo: "texto" },
      {
        id: "identificacao.turno",
        rotulo: "Turno",
        tipo: "selecao",
        opcoes: ["Manhã", "Tarde", "Noite", "Integral"],
      },
      { id: "identificacao.horario", rotulo: "Horário", tipo: "texto" },
      {
        id: "identificacao.publica_privada",
        rotulo: "Escola pública ou privada",
        tipo: "selecao",
        opcoes: ["Pública", "Privada"],
      },
      { id: "identificacao.escola_fone", rotulo: "Fone da escola", tipo: "texto" },
      { id: "identificacao.professor_responsavel", rotulo: "Professor(a) responsável", tipo: "texto" },
      { id: "identificacao.coordenador", rotulo: "Coordenador(a)", tipo: "texto" },
      {
        id: "identificacao.encaminhado_pela_escola",
        rotulo: "Encaminhado pela escola",
        tipo: "selecao",
        opcoes: ["Sim", "Não", "Outro"],
        campoDetalheId: "identificacao.encaminhado_outro_detalhe",
        valorGatilho: "Outro",
      },
      { id: "identificacao.encaminhado_outro_detalhe", rotulo: "Qual", tipo: "texto" },
      { id: "identificacao.pai_nome", rotulo: "Nome do pai", tipo: "texto" },
      { id: "identificacao.pai_idade", rotulo: "Idade do pai", tipo: "numero" },
      { id: "identificacao.pai_fone", rotulo: "Fone do pai", tipo: "texto" },
      { id: "identificacao.pai_profissao", rotulo: "Profissão do pai", tipo: "texto" },
      { id: "identificacao.mae_nome", rotulo: "Nome da mãe", tipo: "texto" },
      { id: "identificacao.mae_idade", rotulo: "Idade da mãe", tipo: "numero" },
      { id: "identificacao.mae_fone", rotulo: "Fone da mãe", tipo: "texto" },
      { id: "identificacao.mae_profissao", rotulo: "Profissão da mãe", tipo: "texto" },
      { id: "identificacao.endereco", rotulo: "Endereço", tipo: "texto" },
      { id: "identificacao.bairro", rotulo: "Bairro", tipo: "texto" },
      { id: "identificacao.cidade", rotulo: "Cidade", tipo: "texto" },
    ],
  },
  {
    id: "composicao_familiar",
    titulo: "Composição Familiar",
    campos: [
      {
        id: "composicao_familiar.relacao_pais_hoje",
        rotulo: "Relação dos pais hoje",
        tipo: "selecao",
        opcoes: ["Casados", "Separados", "Divorciados", "União estável", "Viúvo(a)", "Outro"],
        campoDetalheId: "composicao_familiar.relacao_pais_outro_detalhe",
        valorGatilho: "Outro",
      },
      { id: "composicao_familiar.relacao_pais_outro_detalhe", rotulo: "Qual", tipo: "texto" },
      {
        id: "composicao_familiar.familiares",
        rotulo: "Outras crianças e parentes que moram com a criança",
        tipo: "tabela_familiares",
      },
    ],
  },
  {
    id: "identificacao_problema",
    titulo: "Identificação do Problema",
    campos: [
      { id: "identificacao_problema.queixa_motivo", rotulo: "Queixa (motivo)", tipo: "texto_longo", obrigatorio: true },
    ],
  },
  {
    id: "concepcao",
    titulo: "Concepção",
    campos: [
      {
        id: "concepcao.filho_natural_adotivo",
        rotulo: "Filiação",
        tipo: "selecao",
        opcoes: ["Filho natural", "Filho adotivo"],
      },
      { id: "concepcao.idade_pai_epoca", rotulo: "Idade do pai na época", tipo: "numero" },
      { id: "concepcao.idade_mae_epoca", rotulo: "Idade da mãe na época", tipo: "numero" },
      {
        id: "concepcao.gravidez_planejada_casual",
        rotulo: "Gravidez foi planejada ou casual",
        tipo: "selecao",
        opcoes: ["Planejada", "Casual"],
      },
      { id: "concepcao.numero_gestacoes_anteriores", rotulo: "Número de gestações anteriores", tipo: "numero" },
      { id: "concepcao.abortos", rotulo: "Abortos", tipo: "sim_nao" },
      { id: "concepcao.abortos_naturais", rotulo: "Naturais", tipo: "sim_nao" },
      { id: "concepcao.abortos_provocados", rotulo: "Provocados", tipo: "sim_nao" },
    ],
  },
  {
    id: "gestacao",
    titulo: "Gestação",
    campos: [
      {
        id: "gestacao.acompanhamento_prenatal",
        rotulo: "Acompanhamento pré-natal",
        tipo: "sim_nao",
        campoDetalheId: "gestacao.acompanhamento_prenatal_detalhe",
        valorGatilho: "Sim",
      },
      { id: "gestacao.acompanhamento_prenatal_detalhe", rotulo: "Detalhes", tipo: "texto" },
      {
        id: "gestacao.ingestao_drogas",
        rotulo: "Ingestão de drogas (lícitas e/ou ilícitas)",
        tipo: "sim_nao",
        campoDetalheId: "gestacao.ingestao_drogas_detalhe",
        valorGatilho: "Sim",
      },
      { id: "gestacao.ingestao_drogas_detalhe", rotulo: "Quais", tipo: "texto" },
      {
        id: "gestacao.quedas_acidentes",
        rotulo: "Quedas ou acidentes durante a gestação",
        tipo: "sim_nao",
        campoDetalheId: "gestacao.quedas_acidentes_detalhe",
        valorGatilho: "Sim",
      },
      { id: "gestacao.quedas_acidentes_detalhe", rotulo: "Detalhes", tipo: "texto" },
      {
        id: "gestacao.medicacao",
        rotulo: "Tomou alguma medicação",
        tipo: "sim_nao",
        campoDetalheId: "gestacao.medicacao_detalhe",
        valorGatilho: "Sim",
      },
      { id: "gestacao.medicacao_detalhe", rotulo: "Qual", tipo: "texto" },
      {
        id: "gestacao.doencas",
        rotulo: "Doenças na gestação",
        tipo: "multipla_escolha",
        opcoes: ["Rubéola", "Toxoplasmose", "Sífilis", "Hipertensão", "Diabetes", "Outras"],
        campoDetalheId: "gestacao.doencas_outras_detalhe",
        valorGatilho: "Outras",
      },
      { id: "gestacao.doencas_outras_detalhe", rotulo: "Quais outras", tipo: "texto" },
      { id: "gestacao.condicoes_emocionais", rotulo: "Condições emocionais", tipo: "texto_longo" },
    ],
  },
  {
    id: "parto",
    titulo: "Parto",
    campos: [
      {
        id: "parto.tipo",
        rotulo: "Tipo de parto",
        tipo: "selecao",
        opcoes: ["Normal", "Induzido", "Cesárea"],
      },
      { id: "parto.cordao_umbilical_pescoco", rotulo: "Cordão umbilical em volta do pescoço", tipo: "sim_nao" },
      { id: "parto.nasceu_roxinho", rotulo: "Nasceu roxinho", tipo: "sim_nao" },
      { id: "parto.necessitou_oxigenio", rotulo: "Necessitou de oxigênio", tipo: "sim_nao" },
      { id: "parto.teve_convulsoes", rotulo: "Teve convulsões", tipo: "sim_nao" },
      { id: "parto.altura", rotulo: "Altura", tipo: "texto" },
      { id: "parto.peso", rotulo: "Peso", tipo: "texto" },
      { id: "parto.teve_ictericia", rotulo: "Teve icterícia", tipo: "sim_nao" },
    ],
  },
  {
    id: "alimentacao",
    titulo: "Alimentação",
    campos: [
      {
        id: "alimentacao.mamou_peito",
        rotulo: "Mamou no peito",
        tipo: "sim_nao",
        campoDetalheId: "alimentacao.mamou_peito_tempo",
        valorGatilho: "Sim",
      },
      { id: "alimentacao.mamou_peito_tempo", rotulo: "Tempo", tipo: "texto" },
      {
        id: "alimentacao.tomou_mamadeira",
        rotulo: "Tomou mamadeira",
        tipo: "sim_nao",
        campoDetalheId: "alimentacao.tomou_mamadeira_tempo",
        valorGatilho: "Sim",
      },
      { id: "alimentacao.tomou_mamadeira_tempo", rotulo: "Tempo", tipo: "texto" },
      { id: "alimentacao.hora_para_refeicoes", rotulo: "Hoje tem hora para as refeições", tipo: "sim_nao" },
      {
        id: "alimentacao.como_come",
        rotulo: "Como a criança come",
        tipo: "selecao",
        opcoes: ["Rápido", "Devagar", "Sofreguidão", "Voracidade", "Mastiga bem"],
      },
      {
        id: "alimentacao.refeicoes_com_familia",
        rotulo: "Faz as refeições com a família",
        tipo: "sim_nao",
        campoDetalheId: "alimentacao.refeicoes_com_familia_detalhe",
        valorGatilho: "Sim",
      },
      { id: "alimentacao.refeicoes_com_familia_detalhe", rotulo: "Onde? Vendo TV?", tipo: "texto" },
      { id: "alimentacao.preferencia_alimentar", rotulo: "Preferência alimentar", tipo: "texto_longo" },
    ],
  },
  {
    id: "historia_clinica",
    titulo: "História Clínica",
    campos: [
      {
        id: "historia_clinica.doencas",
        rotulo: "Doenças/condições já apresentadas",
        tipo: "multipla_escolha",
        opcoes: [
          "Febre alta",
          "Sarampo",
          "Meningite",
          "Caxumba",
          "Rubéola",
          "Coqueluche",
          "Desidratação grave",
          "Otite",
          "Complicação com vacinas",
          "Adenoides",
          "Amigdalites",
          "Alergias",
          "Acidentes",
          "Asma",
          "Infecção de ouvido",
          "Catapora",
          "Bronquite",
          "Convulsões",
        ],
      },
      {
        id: "historia_clinica.uso_medicacao",
        rotulo: "Faz uso de medicação",
        tipo: "sim_nao",
        campoDetalheId: "historia_clinica.uso_medicacao_detalhe",
        valorGatilho: "Sim",
      },
      { id: "historia_clinica.uso_medicacao_detalhe", rotulo: "Qual", tipo: "texto" },
      { id: "historia_clinica.acompanhamentos_saude", rotulo: "Acompanhamentos que faz na área da saúde", tipo: "texto_longo" },
    ],
  },
  {
    id: "sono",
    titulo: "Sono",
    campos: [
      { id: "sono.onde_dorme", rotulo: "Onde a criança dorme? Tem seu quarto?", tipo: "texto" },
      { id: "sono.dorme_cama_pais", rotulo: "Tem o costume de dormir na cama dos pais", tipo: "sim_nao" },
      { id: "sono.hora_dorme", rotulo: "Que horas dorme", tipo: "hora" },
      { id: "sono.hora_acorda", rotulo: "Que horas acorda", tipo: "hora" },
      {
        id: "sono.qualidade",
        rotulo: "Sono",
        tipo: "multipla_escolha",
        opcoes: ["Tranquilo", "Agitado", "Range dentes", "Terror noturno", "Sonambulismo"],
      },
      { id: "sono.fala_dormindo", rotulo: "Fala dormindo", tipo: "sim_nao" },
      {
        id: "sono.habitos_especiais",
        rotulo: "Hábitos especiais (presença de alguém, objetos, embalo, bico, chupa dedo etc.)",
        tipo: "texto_longo",
      },
    ],
  },
  {
    id: "desenvolvimento_psicomotor",
    titulo: "Desenvolvimento Psicomotor",
    campos: [
      { id: "desenvolvimento_psicomotor.idade_sentou", rotulo: "Com que idade sentou", tipo: "texto" },
      { id: "desenvolvimento_psicomotor.engatinhou", rotulo: "Engatinhou", tipo: "sim_nao" },
      { id: "desenvolvimento_psicomotor.forma_engatinhar", rotulo: "Forma de engatinhar", tipo: "texto" },
      { id: "desenvolvimento_psicomotor.idade_andou", rotulo: "Com que idade andou", tipo: "texto" },
      { id: "desenvolvimento_psicomotor.caia_muito", rotulo: "Caía muito", tipo: "sim_nao" },
      {
        id: "desenvolvimento_psicomotor.dificuldade_motora",
        rotulo: "Acredita que tenha alguma dificuldade motora",
        tipo: "sim_nao",
        campoDetalheId: "desenvolvimento_psicomotor.dificuldade_motora_detalhe",
        valorGatilho: "Sim",
      },
      { id: "desenvolvimento_psicomotor.dificuldade_motora_detalhe", rotulo: "Qual", tipo: "texto" },
    ],
  },
  {
    id: "controle_esfincteres",
    titulo: "Controle de Esfíncteres",
    campos: [
      { id: "controle_esfincteres.idade_parou_fraldas", rotulo: "Com que idade parou de usar fraldas", tipo: "texto" },
      {
        id: "controle_esfincteres.controle",
        rotulo: "Controle esfincteriano",
        tipo: "selecao",
        opcoes: ["Completo", "Parcial", "Ainda não"],
      },
    ],
  },
  {
    id: "desenvolvimento_linguagem",
    titulo: "Desenvolvimento da Linguagem",
    campos: [
      { id: "desenvolvimento_linguagem.balbuciou", rotulo: "Balbuciou", tipo: "sim_nao" },
      { id: "desenvolvimento_linguagem.idade_comecou_falar", rotulo: "Com que idade começou a falar", tipo: "texto" },
      {
        id: "desenvolvimento_linguagem.uso_bico",
        rotulo: "Fez uso de bico",
        tipo: "sim_nao",
        campoDetalheId: "desenvolvimento_linguagem.uso_bico_ate_idade",
        valorGatilho: "Sim",
      },
      { id: "desenvolvimento_linguagem.uso_bico_ate_idade", rotulo: "Até que idade", tipo: "texto" },
      {
        id: "desenvolvimento_linguagem.compreende_ordens",
        rotulo: "Compreende ordens",
        tipo: "selecao",
        opcoes: ["Sim", "Não", "Parcialmente"],
      },
      { id: "desenvolvimento_linguagem.como_se_comunica", rotulo: "Como a criança se comunica", tipo: "texto_longo" },
    ],
  },
  {
    id: "escolaridade",
    titulo: "Escolaridade",
    campos: [
      { id: "escolaridade.frequentou_creche", rotulo: "Frequentou creches/educação infantil", tipo: "sim_nao" },
      { id: "escolaridade.idade_entrou_escola", rotulo: "Idade que entrou para a escola", tipo: "texto" },
      {
        id: "escolaridade.adaptacao",
        rotulo: "Adaptação",
        tipo: "selecao",
        opcoes: ["Boa", "Regular", "Difícil"],
      },
      {
        id: "escolaridade.repetiu_ano",
        rotulo: "Repetiu de ano",
        tipo: "sim_nao",
        campoDetalheId: "escolaridade.repetiu_ano_motivo",
        valorGatilho: "Sim",
      },
      { id: "escolaridade.repetiu_ano_motivo", rotulo: "Por quê", tipo: "texto" },
      {
        id: "escolaridade.faz_tarefas_sozinho",
        rotulo: "Faz as tarefas sozinho(a)",
        tipo: "selecao",
        opcoes: ["Sozinho", "Com ajuda", "Não faz"],
      },
      { id: "escolaridade.com_quem_faz_tarefas", rotulo: "Com quem faz as tarefas", tipo: "texto" },
      {
        id: "escolaridade.fatos_importantes_vida_escolar",
        rotulo: "Fatos importantes que aconteceram na vida escolar",
        tipo: "texto_longo",
      },
      { id: "escolaridade.queixas_frequentes", rotulo: "Quais as queixas mais frequentes", tipo: "texto_longo" },
      {
        id: "escolaridade.dificuldades",
        rotulo: "Tem dificuldade para",
        tipo: "multipla_escolha",
        opcoes: [
          "Ler",
          "Escrever",
          "Coordenação motora",
          "Contar",
          "Calcular",
          "Esquece o que aprende",
          "Troca letras na escrita ou na leitura",
          "Letra ilegível",
          "Atenção",
          "Concentração",
        ],
      },
      {
        id: "escolaridade.conhecimentos_basicos",
        rotulo: "Conhece",
        tipo: "multipla_escolha",
        opcoes: ["Cores", "Números", "Dinheiro", "Letras", "Meses do ano", "Dias da semana"],
      },
      { id: "escolaridade.sabe_recortar", rotulo: "Sabe recortar", tipo: "sim_nao" },
      { id: "escolaridade.como_pega_lapis", rotulo: "Como pega o lápis", tipo: "texto" },
      {
        id: "escolaridade.escreve_forte_fraco",
        rotulo: "Escreve muito forte ou muito fraco",
        tipo: "selecao",
        opcoes: ["Forte", "Fraco", "Normal"],
      },
    ],
  },
  {
    id: "comportamento",
    titulo: "Comportamento",
    campos: [
      {
        id: "comportamento.prefere_brincar",
        rotulo: "Prefere brincar sozinho ou em grupos",
        tipo: "selecao",
        opcoes: ["Sozinho", "Em grupo", "Ambos"],
      },
      { id: "comportamento.estranha_mudancas_ambiente", rotulo: "Estranha mudanças de ambiente", tipo: "sim_nao" },
      {
        id: "comportamento.adapta_facilmente_meio",
        rotulo: "Adapta-se facilmente ao meio",
        tipo: "selecao",
        opcoes: ["Sim", "Não", "Parcialmente"],
      },
      {
        id: "comportamento.aceita_ordens",
        rotulo: "Aceita bem as ordens",
        tipo: "selecao",
        opcoes: ["Sim", "Não", "Às vezes"],
      },
      {
        id: "comportamento.agressividade_apatia_teimosia",
        rotulo: "Apresenta agressividade, apatia ou teimosia",
        tipo: "multipla_escolha",
        opcoes: ["Agressividade", "Apatia", "Teimosia", "Nenhum"],
      },
      {
        id: "comportamento.tem_medo",
        rotulo: "Tem algum medo",
        tipo: "sim_nao",
        campoDetalheId: "comportamento.tem_medo_qual",
        valorGatilho: "Sim",
      },
      { id: "comportamento.tem_medo_qual", rotulo: "Qual", tipo: "texto" },
      { id: "comportamento.em_familia", rotulo: "Como se comporta em família", tipo: "texto_longo" },
      { id: "comportamento.com_outras_pessoas", rotulo: "Como se comporta com outras pessoas", tipo: "texto_longo" },
      {
        id: "comportamento.com_quem_mais_gosta_ficar",
        rotulo: "Com quem ela mais gosta de ficar e por quê",
        tipo: "texto_longo",
      },
    ],
  },
  {
    id: "visao",
    titulo: "Visão",
    campos: [
      {
        id: "visao.problema",
        rotulo: "Algum problema",
        tipo: "sim_nao",
        campoDetalheId: "visao.problema_qual",
        valorGatilho: "Sim",
      },
      { id: "visao.problema_qual", rotulo: "Qual", tipo: "texto" },
      { id: "visao.usa_oculos", rotulo: "Usa óculos", tipo: "sim_nao" },
      { id: "visao.cirurgia", rotulo: "Cirurgia", tipo: "sim_nao" },
    ],
  },
  {
    id: "audicao",
    titulo: "Audição",
    campos: [
      {
        id: "audicao.problema",
        rotulo: "Algum problema",
        tipo: "sim_nao",
        campoDetalheId: "audicao.problema_qual",
        valorGatilho: "Sim",
      },
      { id: "audicao.problema_qual", rotulo: "Qual", tipo: "texto" },
      { id: "audicao.cirurgia", rotulo: "Cirurgia", tipo: "sim_nao" },
      { id: "audicao.parece_nao_ouvir", rotulo: "Parece não ouvir quando é chamado", tipo: "sim_nao" },
      { id: "audicao.fez_audiometria", rotulo: "Já fez audiometria", tipo: "sim_nao" },
    ],
  },
  {
    id: "habitos",
    titulo: "Hábitos",
    campos: [
      { id: "habitos.roi_unha", rotulo: "Rói unha", tipo: "sim_nao" },
      {
        id: "habitos.tiques_nervosos",
        rotulo: "Tem tiques nervosos",
        tipo: "sim_nao",
        campoDetalheId: "habitos.tiques_nervosos_qual",
        valorGatilho: "Sim",
      },
      { id: "habitos.tiques_nervosos_qual", rotulo: "Qual", tipo: "texto" },
      {
        id: "habitos.mania_repetitiva",
        rotulo: "Alguma mania repetitiva",
        tipo: "sim_nao",
        campoDetalheId: "habitos.mania_repetitiva_qual",
        valorGatilho: "Sim",
      },
      { id: "habitos.mania_repetitiva_qual", rotulo: "Qual", tipo: "texto" },
      {
        id: "habitos.chupa_dedo_bico",
        rotulo: "Chupa dedo ou bico",
        tipo: "selecao",
        opcoes: ["Dedo", "Bico", "Ambos", "Nenhum"],
      },
    ],
  },
  {
    id: "relacionamento",
    titulo: "Relacionamento",
    campos: [
      {
        id: "relacionamento.relaciona_outras_criancas",
        rotulo: "Relaciona-se com outras crianças",
        tipo: "selecao",
        opcoes: ["Sim", "Não", "Com dificuldade"],
      },
      { id: "relacionamento.tem_amigos", rotulo: "Tem amigos? Como é essa relação?", tipo: "texto_longo" },
      {
        id: "relacionamento.escola_colegas_professores",
        rotulo: "Como é a relação na escola com colegas e professores",
        tipo: "texto_longo",
      },
      {
        id: "relacionamento.familia_pais_irmaos",
        rotulo: "Como é a relação na família com os pais e irmãos",
        tipo: "texto_longo",
      },
    ],
  },
  {
    id: "estimulacao",
    titulo: "Estimulação",
    campos: [
      {
        id: "estimulacao.acesso_a",
        rotulo: "A criança tem acesso à",
        tipo: "multipla_escolha",
        opcoes: [
          "Brinquedos",
          "Jogos pedagógicos",
          "Revistas, livros",
          "Videogame",
          "Tablet",
          "Celular",
          "Computador",
        ],
      },
      {
        id: "estimulacao.acesso_eletronicos_como",
        rotulo: "Como é o acesso aos eletrônicos",
        tipo: "selecao",
        opcoes: ["Livre", "Controlado", "Restrito"],
      },
      { id: "estimulacao.controle_conteudo_internet", rotulo: "É feito controle do conteúdo acessado", tipo: "sim_nao" },
    ],
  },
];

export const TODOS_CAMPOS: CampoAnamnese[] = ANAMNESE_SCHEMA.flatMap((secao) => secao.campos);

export function encontrarCampo(id: string): CampoAnamnese | undefined {
  return TODOS_CAMPOS.find((campo) => campo.id === id);
}
