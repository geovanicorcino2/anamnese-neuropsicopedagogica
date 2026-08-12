// Identidade visual configurável do relatório (logo + borda), lida do Perfil no momento da
// exportação. Nenhum dos dois é obrigatório — ver docxAnamneseBuilder.ts/pdfHtmlTemplate.ts pro
// comportamento quando cada um está ausente.
export interface IdentidadeVisualConfig {
  logoBase64: string | null;
  logoMime: string | null;
  bordaBase64: string | null;
  bordaMime: string | null;
}
