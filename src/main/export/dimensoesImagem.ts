// Lê largura/altura de um PNG ou JPEG direto dos bytes (sem depender de nenhuma lib de imagem)
// — usado pra centralizar/escalar a logo enviada pelo usuário preservando a proporção original,
// já que só guardamos o base64 + mime no banco, não as dimensões.

function lerPng(bytes: Buffer): { larguraPx: number; alturaPx: number } | null {
  // Assinatura PNG (8 bytes) + chunk IHDR: length(4) + "IHDR"(4) + width(4) + height(4), big-endian.
  if (bytes.length < 24) return null;
  return { larguraPx: bytes.readUInt32BE(16), alturaPx: bytes.readUInt32BE(20) };
}

function lerJpeg(bytes: Buffer): { larguraPx: number; alturaPx: number } | null {
  let offset = 2; // pula os 2 bytes iniciais (SOI, 0xFFD8)

  while (offset + 9 < bytes.length) {
    if (bytes.readUInt8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marcador = bytes.readUInt8(offset + 1);
    const ehSOF = marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc;

    if (ehSOF) {
      return { alturaPx: bytes.readUInt16BE(offset + 5), larguraPx: bytes.readUInt16BE(offset + 7) };
    }

    const tamanhoSegmento = bytes.readUInt16BE(offset + 2);
    offset += 2 + tamanhoSegmento;
  }

  return null;
}

export function lerDimensoesImagem(base64: string, mime: string): { larguraPx: number; alturaPx: number } {
  const bytes = Buffer.from(base64, "base64");
  const dimensoes = mime === "image/png" ? lerPng(bytes) : lerJpeg(bytes);
  // Fallback conservador (proporção 4:3) se o parsing falhar por algum motivo — nunca deveria
  // acontecer com arquivos válidos vindos do próprio diálogo de upload.
  return dimensoes ?? { larguraPx: 400, alturaPx: 300 };
}
