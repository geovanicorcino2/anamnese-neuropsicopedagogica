import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";

export function FichaNova(): React.JSX.Element {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [escola, setEscola] = useState("");
  const [dataInicioAcompanhamento, setDataInicioAcompanhamento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navegar = useNavigate();

  async function criar(): Promise<void> {
    if (!nome.trim()) return;
    setSalvando(true);
    const ficha = await window.api.fichas.criar({
      nomeCrianca: nome.trim(),
      dataNascimento: dataNascimento || null,
      escola: escola || null,
      dataInicioAcompanhamento: dataInicioAcompanhamento || null,
    });
    navegar(`/fichas/${ficha.ID_Ficha}`);
  }

  return (
    <ScreenContainer>
      <SectionHeader titulo="Nova ficha" subtitulo="Identificação mínima para começar" />
      <Card>
        <FormField id="nome" rotulo="Nome da criança" tipo="texto" valor={nome} onChange={setNome} obrigatorio />
        <FormField
          id="data_nascimento"
          rotulo="Data de nascimento"
          tipo="data"
          valor={dataNascimento}
          onChange={setDataNascimento}
        />
        <FormField id="escola" rotulo="Escola" tipo="texto" valor={escola} onChange={setEscola} />
        <FormField
          id="data_inicio_acompanhamento"
          rotulo="Data de início do acompanhamento"
          tipo="data"
          valor={dataInicioAcompanhamento}
          onChange={setDataInicioAcompanhamento}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={criar} disabled={!nome.trim() || salvando}>
            Criar ficha
          </Button>
          <Button variante="fantasma" onClick={() => navegar("/fichas")}>
            Cancelar
          </Button>
        </div>
      </Card>
    </ScreenContainer>
  );
}
