export const CANAIS = {
  fichasList: "fichas:list",
  fichasGet: "fichas:get",
  fichasCreate: "fichas:create",
  fichasUpdate: "fichas:update",
  fichasDelete: "fichas:delete",

  respostasList: "respostas:list",
  respostasSave: "respostas:save",
  respostasSaveBatch: "respostas:saveBatch",

  familiaresList: "familiares:list",
  familiaresCreate: "familiares:create",
  familiaresUpdate: "familiares:update",
  familiaresDelete: "familiares:delete",

  documentosList: "documentos:list",
  documentosUpload: "documentos:upload",
  documentosRemover: "documentos:remover",
  documentosAbrir: "documentos:abrir",

  perfilGet: "perfil:get",
  perfilUpdate: "perfil:update",
  perfilUploadLogo: "perfil:uploadLogo",
  perfilRemoverLogo: "perfil:removerLogo",
  perfilUploadBorda: "perfil:uploadBorda",
  perfilRemoverBorda: "perfil:removerBorda",

  exportarDocx: "exportar:docx",
  exportarPdf: "exportar:pdf",
  exportarIntervencaoDocx: "exportar:intervencaoDocx",
  exportarIntervencaoPdf: "exportar:intervencaoPdf",
  exportarRelatorioFinalDocx: "exportar:relatorioFinalDocx",
  exportarRelatorioFinalPdf: "exportar:relatorioFinalPdf",

  iaSalvarEntrada: "ia:salvarEntrada",
  iaGerarSugestoes: "ia:gerarSugestoes",
  iaObterSugestao: "ia:obterSugestao",

  relatorioFinalSalvarEntrada: "relatorioFinal:salvarEntrada",
  relatorioFinalGerar: "relatorioFinal:gerar",
  relatorioFinalObter: "relatorioFinal:obter",

  agendamentosListarIntervalo: "agendamentos:listarIntervalo",
  agendamentosCriar: "agendamentos:criar",
  agendamentosRemover: "agendamentos:remover",

  backupDetectarNuvem: "backup:detectarNuvem",
  backupUsarPastaDetectada: "backup:usarPastaDetectada",
  backupEscolherPastaManual: "backup:escolherPastaManual",
  backupRemoverPasta: "backup:removerPasta",
  backupFazerAgora: "backup:fazerAgora",
  backupListar: "backup:listar",
  backupRestaurar: "backup:restaurar",
  backupRestaurarViaDialogo: "backup:restaurarViaDialogo",
  backupBaixarGuia: "backup:baixarGuia",
  backupReiniciarApp: "backup:reiniciarApp",
} as const;
