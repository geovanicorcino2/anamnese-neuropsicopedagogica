import type { Perfil } from "@core/db/types";

export class ErroConfiguracaoIa extends Error {}
export class ErroChamadaIa extends Error {}

function exigirConfiguracao(perfil: Perfil): { provedor: NonNullable<Perfil["IA_Provedor"]>; chave: string; modelo: string } {
  if (!perfil.IA_Provedor || !perfil.IA_Chave || !perfil.IA_Modelo) {
    throw new ErroConfiguracaoIa(
      "IA ainda não configurada — defina provedor, chave de API e modelo na aba Perfil.",
    );
  }
  return { provedor: perfil.IA_Provedor, chave: perfil.IA_Chave, modelo: perfil.IA_Modelo };
}

async function chamarAnthropic(chave: string, modelo: string, prompt: string): Promise<string> {
  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": chave, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: modelo, max_tokens: 2048, messages: [{ role: "user", content: prompt }] }),
  });
  if (!resposta.ok) {
    throw new ErroChamadaIa(`Anthropic recusou a requisição (HTTP ${resposta.status}): ${await resposta.text()}`);
  }
  const corpo = (await resposta.json()) as { content?: Array<{ type: string; text?: string }> };
  const texto = corpo.content?.find((bloco) => bloco.type === "text")?.text;
  if (!texto) throw new ErroChamadaIa("Resposta da Anthropic veio sem texto.");
  return texto;
}

async function chamarOpenAiCompativel(urlBase: string, chave: string, modelo: string, prompt: string): Promise<string> {
  const resposta = await fetch(`${urlBase.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${chave}` },
    body: JSON.stringify({ model: modelo, messages: [{ role: "user", content: prompt }] }),
  });
  if (!resposta.ok) {
    throw new ErroChamadaIa(`Provedor recusou a requisição (HTTP ${resposta.status}): ${await resposta.text()}`);
  }
  const corpo = (await resposta.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const texto = corpo.choices?.[0]?.message?.content;
  if (!texto) throw new ErroChamadaIa("Resposta do provedor veio sem texto.");
  return texto;
}

async function chamarGemini(chave: string, modelo: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${chave}`;
  const resposta = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!resposta.ok) {
    throw new ErroChamadaIa(`Gemini recusou a requisição (HTTP ${resposta.status}): ${await resposta.text()}`);
  }
  const corpo = (await resposta.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const texto = corpo.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new ErroChamadaIa("Resposta do Gemini veio sem texto.");
  return texto;
}

export async function gerarTextoIa(perfil: Perfil, prompt: string): Promise<string> {
  const { provedor, chave, modelo } = exigirConfiguracao(perfil);

  switch (provedor) {
    case "anthropic":
      return chamarAnthropic(chave, modelo, prompt);
    case "openai":
      return chamarOpenAiCompativel("https://api.openai.com/v1", chave, modelo, prompt);
    case "gemini":
      return chamarGemini(chave, modelo, prompt);
    case "personalizado": {
      if (!perfil.IA_Url_Personalizada) {
        throw new ErroConfiguracaoIa("Provedor personalizado precisa da URL base da API (aba Perfil).");
      }
      return chamarOpenAiCompativel(perfil.IA_Url_Personalizada, chave, modelo, prompt);
    }
    default:
      throw new ErroConfiguracaoIa(`Provedor de IA desconhecido: ${provedor}`);
  }
}
