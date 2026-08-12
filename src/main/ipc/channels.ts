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

  perfilGet: "perfil:get",
  perfilUpdate: "perfil:update",
  perfilUploadLogo: "perfil:uploadLogo",
  perfilRemoverLogo: "perfil:removerLogo",
  perfilUploadBorda: "perfil:uploadBorda",
  perfilRemoverBorda: "perfil:removerBorda",

  exportarDocx: "exportar:docx",
  exportarPdf: "exportar:pdf",

  iaGerarSugestoes: "ia:gerarSugestoes",
  iaObterSugestao: "ia:obterSugestao",
} as const;
