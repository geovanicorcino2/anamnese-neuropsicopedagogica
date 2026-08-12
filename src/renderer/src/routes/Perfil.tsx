import { useEffect, useState } from "react";
import type { Perfil as PerfilType, ProvedorIA } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Select } from "../components/Select";

const PROVEDORES: Array<{ valor: ProvedorIA; rotulo: string; modeloSugerido: string }> = [
  { valor: "anthropic", rotulo: "Anthropic (Claude)", modeloSugerido: "claude-sonnet-4-5-20250929" },
  { valor: "openai", rotulo: "OpenAI (GPT)", modeloSugerido: "gpt-4o-mini" },
  { valor: "gemini", rotulo: "Google (Gemini)", modeloSugerido: "gemini-2.0-flash" },
  { valor: "personalizado", rotulo: "Personalizado (compatível com OpenAI)", modeloSugerido: "" },
];

export function Perfil(): React.JSX.Element {
  const [perfil, setPerfil] = useState<PerfilType | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoBorda, setEnviandoBorda] = useState(false);
  const [erroImagem, setErroImagem] = useState<string | null>(null);

  useEffect(() => {
    window.api.perfil.obter().then((p) => setPerfil(p ?? null));
  }, []);

  async function salvar(): Promise<void> {
    if (!perfil) return;
    await window.api.perfil.atualizar({
      Nome_Profissional: perfil.Nome_Profissional,
      Titulo: perfil.Titulo,
      Nome_Clinica: perfil.Nome_Clinica,
      IA_Provedor: perfil.IA_Provedor,
      IA_Chave: perfil.IA_Chave,
      IA_Modelo: perfil.IA_Modelo,
      IA_Url_Personalizada: perfil.IA_Url_Personalizada,
    });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  async function enviarLogo(): Promise<void> {
    setErroImagem(null);
    setEnviandoLogo(true);
    try {
      const resultado = await window.api.perfil.uploadLogo();
      if (!resultado.cancelado && resultado.perfil) setPerfil(resultado.perfil);
    } catch (erro) {
      setErroImagem(erro instanceof Error ? erro.message : String(erro));
    } finally {
      setEnviandoLogo(false);
    }
  }

  async function removerLogo(): Promise<void> {
    const atualizado = await window.api.perfil.removerLogo();
    if (atualizado) setPerfil(atualizado);
  }

  async function enviarBorda(): Promise<void> {
    setErroImagem(null);
    setEnviandoBorda(true);
    try {
      const resultado = await window.api.perfil.uploadBorda();
      if (!resultado.cancelado && resultado.perfil) setPerfil(resultado.perfil);
    } catch (erro) {
      setErroImagem(erro instanceof Error ? erro.message : String(erro));
    } finally {
      setEnviandoBorda(false);
    }
  }

  async function removerBorda(): Promise<void> {
    const atualizado = await window.api.perfil.removerBorda();
    if (atualizado) setPerfil(atualizado);
  }

  if (!perfil) {
    return (
      <ScreenContainer>
        <SectionHeader titulo="Perfil" />
        <Card>Carregando…</Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader titulo="Perfil" subtitulo="Dados que aparecem no timbre dos documentos exportados" />
      <Card>
        <FormField
          id="nome_profissional"
          rotulo="Nome do(a) profissional"
          tipo="texto"
          valor={perfil.Nome_Profissional}
          onChange={(v) => setPerfil({ ...perfil, Nome_Profissional: v })}
        />
        <FormField
          id="titulo"
          rotulo="Título/especialidade"
          tipo="texto"
          valor={perfil.Titulo}
          onChange={(v) => setPerfil({ ...perfil, Titulo: v })}
        />
        <FormField
          id="nome_clinica"
          rotulo="Nome da clínica"
          tipo="texto"
          valor={perfil.Nome_Clinica}
          onChange={(v) => setPerfil({ ...perfil, Nome_Clinica: v })}
        />
      </Card>

      <SectionHeader titulo="Identidade visual do relatório" subtitulo="Logo e borda opcionais — sem nenhum dos dois, o relatório sai normal" />
      <Card>
        {erroImagem && <p style={{ color: "var(--cor-perigo)", marginBottom: 12 }}>{erroImagem}</p>}
        <div className="formulario-secao__grid">
          <div>
            <p className="campo__rotulo">Logo</p>
            {perfil.Logo_Base64 ? (
              <>
                <img
                  src={`data:${perfil.Logo_Mime};base64,${perfil.Logo_Base64}`}
                  alt="Logo do relatório"
                  style={{ maxWidth: 160, maxHeight: 120, display: "block", marginBottom: 8, borderRadius: 8 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variante="secundario" onClick={enviarLogo} disabled={enviandoLogo}>
                    Trocar
                  </Button>
                  <Button variante="perigo" onClick={removerLogo}>
                    Remover
                  </Button>
                </div>
              </>
            ) : (
              <Button variante="secundario" onClick={enviarLogo} disabled={enviandoLogo}>
                {enviandoLogo ? "Enviando…" : "Enviar imagem (PNG/JPEG)"}
              </Button>
            )}
          </div>
          <div>
            <p className="campo__rotulo">Borda (aparece nos 4 cantos da página)</p>
            {perfil.Borda_Base64 ? (
              <>
                <img
                  src={`data:${perfil.Borda_Mime};base64,${perfil.Borda_Base64}`}
                  alt="Borda do relatório"
                  style={{ maxWidth: 160, maxHeight: 120, display: "block", marginBottom: 8, borderRadius: 8 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variante="secundario" onClick={enviarBorda} disabled={enviandoBorda}>
                    Trocar
                  </Button>
                  <Button variante="perigo" onClick={removerBorda}>
                    Remover
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variante="secundario" onClick={enviarBorda} disabled={enviandoBorda}>
                  {enviandoBorda ? "Enviando…" : "Enviar imagem (PNG/JPEG)"}
                </Button>
                <p style={{ fontSize: 12, color: "var(--cor-texto-suave)", marginTop: 6 }}>
                  Sem imagem própria, usa a borda decorativa original.
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      <SectionHeader titulo="Inteligência Artificial" subtitulo="Opcional — necessário só pra usar a aba Sugestões de Intervenção" />
      <Card>
        <Select
          id="ia_provedor"
          rotulo="Provedor"
          opcoes={PROVEDORES.map((p) => p.rotulo)}
          valor={PROVEDORES.find((p) => p.valor === perfil.IA_Provedor)?.rotulo ?? ""}
          onChange={(rotuloEscolhido) => {
            const provedor = PROVEDORES.find((p) => p.rotulo === rotuloEscolhido);
            if (!provedor) return;
            setPerfil({
              ...perfil,
              IA_Provedor: provedor.valor,
              IA_Modelo: perfil.IA_Modelo || provedor.modeloSugerido || null,
            });
          }}
        />
        <FormField
          id="ia_chave"
          rotulo="Chave de API"
          tipo="texto"
          valor={perfil.IA_Chave ?? ""}
          onChange={(v) => setPerfil({ ...perfil, IA_Chave: v || null })}
        />
        <FormField
          id="ia_modelo"
          rotulo="Modelo"
          tipo="texto"
          valor={perfil.IA_Modelo ?? ""}
          onChange={(v) => setPerfil({ ...perfil, IA_Modelo: v || null })}
        />
        {perfil.IA_Provedor === "personalizado" && (
          <FormField
            id="ia_url"
            rotulo="URL base da API (compatível com OpenAI)"
            tipo="texto"
            valor={perfil.IA_Url_Personalizada ?? ""}
            onChange={(v) => setPerfil({ ...perfil, IA_Url_Personalizada: v || null })}
          />
        )}
      </Card>

      <Button onClick={salvar}>{salvo ? "Salvo ✓" : "Salvar"}</Button>
    </ScreenContainer>
  );
}
