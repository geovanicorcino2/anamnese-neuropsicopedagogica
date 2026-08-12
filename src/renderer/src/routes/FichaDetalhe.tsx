import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Ficha, RespostaFicha } from "@core/db/types";
import { ANAMNESE_SCHEMA } from "@core/data/anamneseSchema";
import { calcularProgressoSecao } from "@core/services/progressoFicha";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { ProgressBar } from "../components/ProgressBar";

export function FichaDetalhe(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [respostas, setRespostas] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    if (!id) return;
    window.api.fichas.obter(id).then((f) => setFicha(f ?? null));
    window.api.respostas.listar(id).then((lista: RespostaFicha[]) => {
      setRespostas(new Map(lista.map((r) => [r.ID_Campo, r.Valor])));
    });
  }, [id]);

  if (!id) return <ScreenContainer>Ficha inválida.</ScreenContainer>;
  if (!ficha || !respostas) return <ScreenContainer>Carregando…</ScreenContainer>;

  const progressoGeral = Math.round(
    ANAMNESE_SCHEMA.reduce((soma, secao) => soma + calcularProgressoSecao(secao, respostas), 0) /
      ANAMNESE_SCHEMA.length,
  );

  async function alternarStatus(): Promise<void> {
    if (!ficha) return;
    const novoStatus = ficha.Status === "Concluída" ? "Rascunho" : "Concluída";
    await window.api.fichas.atualizar(ficha.ID_Ficha, { Status: novoStatus });
    setFicha({ ...ficha, Status: novoStatus });
  }

  return (
    <ScreenContainer>
      <SectionHeader
        titulo={ficha.Nome_Crianca}
        subtitulo={ficha.Escola ?? undefined}
        acoes={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Chip status={ficha.Status} />
            <Button variante="secundario" onClick={alternarStatus}>
              {ficha.Status === "Concluída" ? "Reabrir" : "Marcar concluída"}
            </Button>
            <Button onClick={() => navegar(`/fichas/${ficha.ID_Ficha}/exportar`)}>Exportar</Button>
          </div>
        }
      />

      <Card>
        <div style={{ marginBottom: 8, fontSize: 13, color: "var(--cor-texto-suave)" }}>
          Progresso geral: {progressoGeral}%
        </div>
        <ProgressBar percentual={progressoGeral} />
      </Card>

      <Card>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => navegar(`/fichas/${ficha.ID_Ficha}/familiares`)}
        >
          <span style={{ fontWeight: 600 }}>Composição familiar — outras pessoas na casa</span>
          <span style={{ color: "var(--cor-roxo-escuro)" }}>Gerenciar →</span>
        </div>
      </Card>

      <Card>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => navegar(`/fichas/${ficha.ID_Ficha}/historico-medico`)}
        >
          <span style={{ fontWeight: 600 }}>Histórico médico — relatórios, laudos e encaminhamentos</span>
          <span style={{ color: "var(--cor-roxo-escuro)" }}>Gerenciar →</span>
        </div>
      </Card>

      {ANAMNESE_SCHEMA.map((secao) => {
        const progresso = calcularProgressoSecao(secao, respostas);
        return (
          <Card key={secao.id}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8 }}
              onClick={() => navegar(`/fichas/${ficha.ID_Ficha}/secao/${secao.id}`)}
            >
              <span style={{ fontWeight: 600 }}>{secao.titulo}</span>
              <span style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>{progresso}%</span>
            </div>
            <ProgressBar percentual={progresso} />
          </Card>
        );
      })}
    </ScreenContainer>
  );
}
