import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { DocumentoMedico } from "@core/db/types";
import { TIPOS_DOCUMENTO_MEDICO } from "@core/data/documentosMedicos";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Select } from "../components/Select";
import { EmptyState } from "../components/EmptyState";
import { formatarDataHora } from "../utils/formatar";

export function FichaHistoricoMedico(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoMedico[] | null>(null);
  const [tipo, setTipo] = useState<string>(TIPOS_DOCUMENTO_MEDICO[0]);
  const [nomePersonalizado, setNomePersonalizado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(): Promise<void> {
    if (!id) return;
    setDocumentos(await window.api.documentos.listar(id));
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function enviar(): Promise<void> {
    if (!id) return;
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await window.api.documentos.upload(id, tipo, nomePersonalizado || null);
      if (!resultado.cancelado) {
        setNomePersonalizado("");
        carregar();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  async function abrir(documentoId: string): Promise<void> {
    setErro(null);
    try {
      await window.api.documentos.abrir(documentoId);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function remover(documentoId: string): Promise<void> {
    if (!id) return;
    await window.api.documentos.remover(documentoId, id);
    carregar();
  }

  if (!id) return <ScreenContainer>Ficha inválida.</ScreenContainer>;

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Histórico médico"
        subtitulo="Relatórios, laudos e encaminhamentos anexados à ficha"
        acoes={
          <Button variante="secundario" onClick={() => navegar(`/fichas/${id}`)}>
            ← Voltar à ficha
          </Button>
        }
      />

      <Card>
        <div className="formulario-secao__grid">
          <Select id="documento_tipo" rotulo="Tipo" opcoes={[...TIPOS_DOCUMENTO_MEDICO]} valor={tipo} onChange={setTipo} />
          <FormField
            id="documento_nome"
            rotulo="Nome (opcional)"
            tipo="texto"
            valor={nomePersonalizado}
            onChange={setNomePersonalizado}
          />
        </div>
        {erro && <p style={{ color: "var(--cor-perigo)", marginBottom: 12 }}>{erro}</p>}
        <Button onClick={enviar} disabled={enviando}>
          {enviando ? "Enviando…" : "Escolher arquivo e enviar"}
        </Button>
      </Card>

      {documentos !== null && documentos.length === 0 && (
        <Card>
          <EmptyState titulo="Nenhum documento anexado ainda" />
        </Card>
      )}

      {documentos?.map((documento) => (
        <Card key={documento.ID_Documento}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{documento.Nome_Personalizado || documento.Nome_Arquivo}</div>
              <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                {documento.Tipo} · {formatarDataHora(documento.Criado_Em)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variante="secundario" onClick={() => abrir(documento.ID_Documento)}>
                Abrir
              </Button>
              <Button variante="perigo" onClick={() => remover(documento.ID_Documento)}>
                Remover
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </ScreenContainer>
  );
}
