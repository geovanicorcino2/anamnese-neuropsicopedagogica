import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Ficha, RespostaFicha } from "@core/db/types";
import { ANAMNESE_SCHEMA } from "@core/data/anamneseSchema";
import { calcularProgressoSecao } from "@core/services/progressoFicha";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ProgressBar } from "../components/ProgressBar";

// Renderizada como aba dentro de PacienteDetalhe.tsx — cabeçalho/status já ficam por conta do
// hub, aqui só o corpo da anamnese (era o corpo inteiro do antigo FichaDetalhe.tsx).
export function PacienteAnamnese(): React.JSX.Element {
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

  if (!id) return <p>Paciente inválido.</p>;
  if (!ficha || !respostas) return <p>Carregando…</p>;

  const progressoGeral = Math.round(
    ANAMNESE_SCHEMA.reduce((soma, secao) => soma + calcularProgressoSecao(secao, respostas), 0) /
      ANAMNESE_SCHEMA.length,
  );

  return (
    <>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Progresso geral: {progressoGeral}%</span>
          <Button onClick={() => navegar(`/pacientes/${id}/exportar`)}>Exportar</Button>
        </div>
        <ProgressBar percentual={progressoGeral} />
      </Card>

      <Card>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => navegar(`/pacientes/${id}/familiares`)}
        >
          <span style={{ fontWeight: 600 }}>Composição familiar — outras pessoas na casa</span>
          <span style={{ color: "var(--cor-roxo-escuro)" }}>Gerenciar →</span>
        </div>
      </Card>

      {ANAMNESE_SCHEMA.map((secao) => {
        const progresso = calcularProgressoSecao(secao, respostas);
        return (
          <Card key={secao.id}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8 }}
              onClick={() => navegar(`/pacientes/${id}/secao/${secao.id}`)}
            >
              <span style={{ fontWeight: 600 }}>{secao.titulo}</span>
              <span style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>{progresso}%</span>
            </div>
            <ProgressBar percentual={progresso} />
          </Card>
        );
      })}
    </>
  );
}
