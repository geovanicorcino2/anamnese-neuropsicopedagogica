export const TIPOS_DOCUMENTO_MEDICO = [
  "Relatório médico",
  "Laudo médico",
  "Relatório psicológico",
  "Encaminhamento da escola",
  "Encaminhamento médico",
  "Outros",
] as const;

export type TipoDocumentoMedico = (typeof TIPOS_DOCUMENTO_MEDICO)[number];

export const TIPO_DOCUMENTO_MEDICO_OUTROS: TipoDocumentoMedico = "Outros";
