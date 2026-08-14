import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Familiar } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { EmptyState } from "../components/EmptyState";

export function FichaFamiliares(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [familiares, setFamiliares] = useState<Familiar[] | null>(null);
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [relacao, setRelacao] = useState("");

  async function carregar(): Promise<void> {
    if (!id) return;
    setFamiliares(await window.api.familiares.listar(id));
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function adicionar(): Promise<void> {
    if (!id || !nome.trim()) return;
    await window.api.familiares.criar({ idFicha: id, nome: nome.trim(), idade: idade || null, relacao: relacao || null });
    setNome("");
    setIdade("");
    setRelacao("");
    carregar();
  }

  async function remover(familiarId: string): Promise<void> {
    if (!id) return;
    await window.api.familiares.remover(familiarId, id);
    carregar();
  }

  if (!id) return <ScreenContainer>Ficha inválida.</ScreenContainer>;

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Composição familiar"
        subtitulo="Outras crianças e parentes que moram com a criança"
        acoes={
          <Button variante="secundario" onClick={() => navegar(`/pacientes/${id}/anamnese`)}>
            ← Voltar à ficha
          </Button>
        }
      />

      <Card>
        <div className="formulario-secao__grid">
          <FormField id="familiar_nome" rotulo="Nome" tipo="texto" valor={nome} onChange={setNome} />
          <FormField id="familiar_idade" rotulo="Idade" tipo="texto" valor={idade} onChange={setIdade} />
          <FormField id="familiar_relacao" rotulo="Relação" tipo="texto" valor={relacao} onChange={setRelacao} />
        </div>
        <Button onClick={adicionar} disabled={!nome.trim()}>
          + Adicionar
        </Button>
      </Card>

      {familiares !== null && familiares.length === 0 && (
        <Card>
          <EmptyState titulo="Nenhum familiar cadastrado ainda" />
        </Card>
      )}

      {familiares?.map((familiar) => (
        <Card key={familiar.ID_Familiar}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{familiar.Nome}</div>
              <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                {familiar.Relacao ?? "Relação não informada"}
                {familiar.Idade ? ` · ${familiar.Idade}` : ""}
              </div>
            </div>
            <Button variante="perigo" onClick={() => remover(familiar.ID_Familiar)}>
              Remover
            </Button>
          </div>
        </Card>
      ))}
    </ScreenContainer>
  );
}
