import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Ficha } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { formatarDataHora } from "../utils/formatar";

export function Fichas(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const navegar = useNavigate();

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Fichas"
        subtitulo="Anamneses cadastradas"
        acoes={
          <Button onClick={() => navegar("/fichas/nova")}>
            + Nova ficha
          </Button>
        }
      />

      {fichas === null && <p>Carregando…</p>}

      {fichas !== null && fichas.length === 0 && (
        <Card>
          <EmptyState
            titulo="Nenhuma ficha cadastrada"
            descricao="Crie a primeira ficha de anamnese para começar."
            acao={
              <Button onClick={() => navegar("/fichas/nova")}>+ Nova ficha</Button>
            }
          />
        </Card>
      )}

      {fichas !== null &&
        fichas.map((ficha) => (
          <Card key={ficha.ID_Ficha}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => navegar(`/fichas/${ficha.ID_Ficha}`)}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{ficha.Nome_Crianca}</div>
                <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                  {ficha.Escola ?? "Escola não informada"} · atualizado em {formatarDataHora(ficha.Atualizado_Em)}
                </div>
              </div>
              <Chip status={ficha.Status} />
            </div>
          </Card>
        ))}
    </ScreenContainer>
  );
}
