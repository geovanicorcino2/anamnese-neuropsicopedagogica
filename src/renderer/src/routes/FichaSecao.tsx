import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { RespostaFicha } from "@core/db/types";
import { ANAMNESE_SCHEMA } from "@core/data/anamneseSchema";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormularioSecao } from "../components/FormularioSecao";

export function FichaSecao(): React.JSX.Element {
  const { id, secaoId } = useParams<{ id: string; secaoId: string }>();
  const navegar = useNavigate();
  const [valores, setValores] = useState<Record<string, string> | null>(null);

  const secao = ANAMNESE_SCHEMA.find((s) => s.id === secaoId);

  useEffect(() => {
    if (!id) return;
    window.api.respostas.listar(id).then((lista: RespostaFicha[]) => {
      const mapa: Record<string, string> = {};
      for (const resposta of lista) mapa[resposta.ID_Campo] = resposta.Valor;
      setValores(mapa);
    });
  }, [id]);

  if (!id || !secao) return <ScreenContainer>Seção não encontrada.</ScreenContainer>;
  if (!valores) return <ScreenContainer>Carregando…</ScreenContainer>;

  function onChangeValor(idCampo: string, valor: string): void {
    if (!id) return;
    setValores((atual) => ({ ...(atual ?? {}), [idCampo]: valor }));
    window.api.respostas.salvar(id, idCampo, valor);
  }

  return (
    <ScreenContainer>
      <SectionHeader
        titulo={secao.titulo}
        subtitulo="As respostas são salvas automaticamente"
        acoes={
          <Button variante="secundario" onClick={() => navegar(`/fichas/${id}`)}>
            ← Voltar à ficha
          </Button>
        }
      />
      <Card>
        <FormularioSecao campos={secao.campos} valores={valores} onChangeValor={onChangeValor} />
      </Card>
    </ScreenContainer>
  );
}
