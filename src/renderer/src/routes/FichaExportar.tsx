import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

type Estado = { tipo: "ocioso" } | { tipo: "gerando"; formato: "docx" | "pdf" } | { tipo: "erro"; mensagem: string };

export function FichaExportar(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });

  async function exportar(formato: "docx" | "pdf"): Promise<void> {
    if (!id) return;
    setEstado({ tipo: "gerando", formato });
    try {
      const resultado = formato === "docx" ? await window.api.exportar.docx(id) : await window.api.exportar.pdf(id);
      if (!resultado.cancelado) {
        setEstado({ tipo: "ocioso" });
      } else {
        setEstado({ tipo: "ocioso" });
      }
    } catch (erro) {
      setEstado({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  if (!id) return <ScreenContainer>Ficha inválida.</ScreenContainer>;

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Exportar ficha"
        subtitulo="Gera o documento com o timbre da clínica, igual ao formulário original"
        acoes={
          <Button variante="secundario" onClick={() => navegar(`/pacientes/${id}/anamnese`)}>
            ← Voltar à ficha
          </Button>
        }
      />

      <Card>
        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={() => exportar("docx")} disabled={estado.tipo === "gerando"}>
            {estado.tipo === "gerando" && estado.formato === "docx" ? "Gerando…" : "Gerar Word (.docx)"}
          </Button>
          <Button onClick={() => exportar("pdf")} disabled={estado.tipo === "gerando"}>
            {estado.tipo === "gerando" && estado.formato === "pdf" ? "Gerando…" : "Gerar PDF"}
          </Button>
        </div>
        {estado.tipo === "erro" && (
          <p style={{ color: "var(--cor-perigo)", marginTop: 12 }}>Erro ao exportar: {estado.mensagem}</p>
        )}
      </Card>
    </ScreenContainer>
  );
}
