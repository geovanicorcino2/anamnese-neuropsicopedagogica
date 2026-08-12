import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Ficha } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { Select } from "../components/Select";
import { formatarData, formatarDataHora } from "../utils/formatar";

const OPCOES_ORDENACAO = ["Última atualização", "Nome (A-Z)", "Data de início"] as const;
type Ordenacao = (typeof OPCOES_ORDENACAO)[number];

function ordenarFichas(fichas: Ficha[], ordenacao: Ordenacao): Ficha[] {
  const ordenadas = [...fichas];
  if (ordenacao === "Nome (A-Z)") {
    ordenadas.sort((a, b) => a.Nome_Crianca.localeCompare(b.Nome_Crianca, "pt-BR"));
  } else if (ordenacao === "Data de início") {
    ordenadas.sort((a, b) =>
      (b.Data_Inicio_Acompanhamento ?? "").localeCompare(a.Data_Inicio_Acompanhamento ?? ""),
    );
  }
  // "Última atualização" já vem nessa ordem do backend (ORDER BY Atualizado_Em DESC).
  return ordenadas;
}

export function Fichas(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("Última atualização");
  const navegar = useNavigate();

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  const fichasExibidas = useMemo(() => {
    if (!fichas) return null;
    const termo = busca.trim().toLowerCase();
    const filtradas = termo ? fichas.filter((f) => f.Nome_Crianca.toLowerCase().includes(termo)) : fichas;
    return ordenarFichas(filtradas, ordenacao);
  }, [fichas, busca, ordenacao]);

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

      {fichas !== null && fichas.length > 0 && (
        <Card>
          <div className="formulario-secao__grid">
            <FormField id="fichas_busca" rotulo="Buscar por nome" tipo="texto" valor={busca} onChange={setBusca} />
            <Select
              id="fichas_ordenacao"
              rotulo="Ordenar por"
              opcoes={[...OPCOES_ORDENACAO]}
              valor={ordenacao}
              onChange={(valor) => setOrdenacao(valor as Ordenacao)}
            />
          </div>
        </Card>
      )}

      {fichasExibidas !== null && fichasExibidas.length === 0 && fichas !== null && fichas.length > 0 && (
        <Card>
          <EmptyState titulo="Nenhuma ficha encontrada" descricao="Tente buscar por outro nome." />
        </Card>
      )}

      {fichasExibidas !== null &&
        fichasExibidas.map((ficha) => (
          <Card key={ficha.ID_Ficha}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => navegar(`/fichas/${ficha.ID_Ficha}`)}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{ficha.Nome_Crianca}</div>
                <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                  {ficha.Escola ?? "Escola não informada"} · início do acompanhamento{" "}
                  {formatarData(ficha.Data_Inicio_Acompanhamento)} · atualizado em{" "}
                  {formatarDataHora(ficha.Atualizado_Em)}
                </div>
              </div>
              <Chip status={ficha.Status} />
            </div>
          </Card>
        ))}
    </ScreenContainer>
  );
}
