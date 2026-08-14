import { useEffect, useState } from "react";
import type { AnexoPaciente, CategoriaAnexoPaciente } from "@core/db/types";
import { Card } from "./Card";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { EmptyState } from "./EmptyState";
import { formatarDataHora } from "../utils/formatar";

interface AnexosSecaoProps {
  idFicha: string;
  categoria: CategoriaAnexoPaciente;
}

// Upload de arquivos já prontos (PDF/DOC/DOCX/foto) — usado nas 3 abas novas do hub de Pacientes
// (Planejamento, Plano Terapêutico, Relatório Avaliativo), mesmo padrão de
// FichaHistoricoMedico.tsx mas reaproveitado entre as 3 (é idêntico nas 3, só a categoria muda).
export function AnexosSecao({ idFicha, categoria }: AnexosSecaoProps): React.JSX.Element {
  const [anexos, setAnexos] = useState<AnexoPaciente[] | null>(null);
  const [nomePersonalizado, setNomePersonalizado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(): Promise<void> {
    setAnexos(await window.api.anexos.listar(idFicha, categoria));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFicha, categoria]);

  async function enviar(): Promise<void> {
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await window.api.anexos.upload(idFicha, categoria, nomePersonalizado || null);
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

  async function abrir(id: string): Promise<void> {
    setErro(null);
    try {
      await window.api.anexos.abrir(id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function remover(id: string): Promise<void> {
    await window.api.anexos.remover(id, idFicha);
    carregar();
  }

  return (
    <>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Arquivos anexados</div>
        <div className="formulario-secao__grid">
          <FormField
            id={`anexo_nome_${categoria}`}
            rotulo="Nome (opcional)"
            tipo="texto"
            valor={nomePersonalizado}
            onChange={setNomePersonalizado}
          />
        </div>
        {erro && <p style={{ color: "var(--cor-perigo)", marginBottom: 12 }}>{erro}</p>}
        <Button onClick={enviar} disabled={enviando}>
          {enviando ? "Enviando…" : "Escolher arquivo e enviar (PDF, Word ou foto)"}
        </Button>
      </Card>

      {anexos !== null && anexos.length === 0 && (
        <Card>
          <EmptyState titulo="Nenhum arquivo anexado ainda" />
        </Card>
      )}

      {anexos?.map((anexo) => (
        <Card key={anexo.ID_Anexo}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{anexo.Nome_Personalizado || anexo.Nome_Arquivo}</div>
              <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                {formatarDataHora(anexo.Criado_Em)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variante="secundario" onClick={() => abrir(anexo.ID_Anexo)}>
                Abrir
              </Button>
              <Button variante="perigo" onClick={() => remover(anexo.ID_Anexo)}>
                Remover
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
