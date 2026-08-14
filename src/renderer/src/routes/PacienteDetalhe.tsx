import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import type { Ficha } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Chip } from "../components/Chip";
import { Button } from "../components/Button";
import { Tabs } from "../components/Tabs";

const ABAS = [
  { segmento: "anamnese", rotulo: "Anamnese" },
  { segmento: "planejamento", rotulo: "Planejamento de Intervenção" },
  { segmento: "plano-terapeutico", rotulo: "Plano Terapêutico" },
  { segmento: "relatorio-avaliativo", rotulo: "Relatório Avaliativo" },
  { segmento: "historico-medico", rotulo: "Histórico Médico" },
];

// Hub do paciente — cabeçalho fixo + abas com o histórico de cada tipo de documento. Substitui o
// antigo FichaDetalhe.tsx (hub plano de cards) — a Anamnese em si virou a primeira aba
// (PacienteAnamnese.tsx), o resto (Planejamento/Plano Terapêutico/Relatório Avaliativo) é novo.
export function PacienteDetalhe(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [ficha, setFicha] = useState<Ficha | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    window.api.fichas.obter(id).then((f) => setFicha(f ?? null));
  }, [id]);

  if (!id) return <ScreenContainer>Paciente inválido.</ScreenContainer>;
  if (ficha === undefined) return <ScreenContainer>Carregando…</ScreenContainer>;
  if (ficha === null) return <ScreenContainer>Paciente não encontrado.</ScreenContainer>;

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
          </div>
        }
      />
      <Tabs base={`/pacientes/${id}`} itens={ABAS} />
      <Outlet />
    </ScreenContainer>
  );
}
