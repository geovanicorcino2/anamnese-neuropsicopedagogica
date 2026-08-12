import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Ficha, SugestaoIA } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { formatarDataHora } from "../utils/formatar";

type Estado = { tipo: "ocioso" } | { tipo: "gerando" } | { tipo: "erro"; mensagem: string };

export function Sugestoes(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [idFichaSelecionada, setIdFichaSelecionada] = useState("");
  const [sugestao, setSugestao] = useState<SugestaoIA | null | undefined>(undefined);
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  useEffect(() => {
    if (!idFichaSelecionada) {
      setSugestao(undefined);
      return;
    }
    setSugestao(undefined);
    window.api.ia.obterSugestao(idFichaSelecionada).then((s) => setSugestao(s ?? null));
  }, [idFichaSelecionada]);

  async function gerar(): Promise<void> {
    if (!idFichaSelecionada) return;
    setEstado({ tipo: "gerando" });
    try {
      const nova = await window.api.ia.gerarSugestoes(idFichaSelecionada);
      setSugestao(nova);
      setEstado({ tipo: "ocioso" });
    } catch (erro) {
      setEstado({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  const fichaSelecionada = fichas?.find((f) => f.ID_Ficha === idFichaSelecionada);

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Sugestões de Intervenção"
        subtitulo="Análise por IA das respostas da anamnese — sempre uma sugestão inicial, a decisão é do profissional"
      />

      <Card>
        {fichas === null && <p>Carregando…</p>}
        {fichas !== null && fichas.length === 0 && <p>Nenhuma ficha cadastrada ainda.</p>}
        {fichas !== null && fichas.length > 0 && (
          <Select
            id="ficha_selecionada"
            rotulo="Ficha"
            opcoes={fichas.map((f) => f.Nome_Crianca)}
            valor={fichaSelecionada?.Nome_Crianca ?? ""}
            onChange={(nome) => {
              const ficha = fichas.find((f) => f.Nome_Crianca === nome);
              setIdFichaSelecionada(ficha?.ID_Ficha ?? "");
            }}
          />
        )}
      </Card>

      {idFichaSelecionada && (
        <Card>
          {estado.tipo === "erro" && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: "var(--cor-perigo)" }}>{estado.mensagem}</p>
              {estado.mensagem.includes("IA ainda não configurada") && (
                <Link to="/perfil" style={{ color: "var(--cor-roxo-escuro)" }}>
                  Ir para o Perfil e configurar a IA →
                </Link>
              )}
            </div>
          )}

          {sugestao === undefined && <p>Carregando…</p>}

          {sugestao === null && estado.tipo !== "gerando" && (
            <>
              <p style={{ marginBottom: 12 }}>Nenhuma sugestão gerada ainda pra esta ficha.</p>
              <Button onClick={gerar}>Gerar sugestões</Button>
            </>
          )}

          {sugestao && (
            <>
              <p style={{ fontSize: 12, color: "var(--cor-texto-suave)", marginBottom: 12 }}>
                Gerado em {formatarDataHora(sugestao.Gerado_Em)}
              </p>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{sugestao.Texto}</p>
              <div style={{ marginTop: 16 }}>
                <Button onClick={gerar} disabled={estado.tipo === "gerando"} variante="secundario">
                  {estado.tipo === "gerando" ? "Gerando…" : "Gerar novamente"}
                </Button>
              </div>
            </>
          )}

          {sugestao === null && estado.tipo === "gerando" && <p>Gerando…</p>}
        </Card>
      )}
    </ScreenContainer>
  );
}
