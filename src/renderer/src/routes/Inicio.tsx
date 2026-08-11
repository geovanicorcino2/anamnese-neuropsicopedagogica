import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Ficha } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { formatarDataHora } from "../utils/formatar";

export function Inicio(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const navegar = useNavigate();

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  const total = fichas?.length ?? 0;
  const concluidas = fichas?.filter((f) => f.Status === "Concluída").length ?? 0;
  const rascunhos = total - concluidas;
  const recentes = fichas?.slice(0, 5) ?? [];

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Início"
        subtitulo="Ana Paula M. Gontijo — Neuropsicopedagoga"
        acoes={<Button onClick={() => navegar("/fichas/nova")}>+ Nova ficha</Button>}
      />

      <div className="formulario-secao__grid">
        <Card>
          <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Total de fichas</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{total}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Rascunhos</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{rascunhos}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Concluídas</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{concluidas}</div>
        </Card>
      </div>

      <SectionHeader titulo="Fichas recentes" />
      {recentes.length === 0 && <Card>Nenhuma ficha ainda.</Card>}
      {recentes.map((ficha) => (
        <Card key={ficha.ID_Ficha}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => navegar(`/fichas/${ficha.ID_Ficha}`)}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{ficha.Nome_Crianca}</div>
              <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                atualizado em {formatarDataHora(ficha.Atualizado_Em)}
              </div>
            </div>
            <Chip status={ficha.Status} />
          </div>
        </Card>
      ))}
    </ScreenContainer>
  );
}
