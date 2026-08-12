import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Ficha, SugestaoIA } from "@core/db/types";
import { TEMPOS_SESSAO } from "@core/data/sugestoesIntervencao";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { FormField } from "../components/FormField";
import { formatarDataHora } from "../utils/formatar";

type Estado = { tipo: "ocioso" } | { tipo: "gerando" } | { tipo: "erro"; mensagem: string };
type EstadoExportacao = { tipo: "ocioso" } | { tipo: "gerando"; formato: "docx" | "pdf" } | { tipo: "erro"; mensagem: string };

export function Sugestoes(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [idFichaSelecionada, setIdFichaSelecionada] = useState("");
  const [sugestao, setSugestao] = useState<SugestaoIA | null | undefined>(undefined);
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [estadoExportacao, setEstadoExportacao] = useState<EstadoExportacao>({ tipo: "ocioso" });

  const [tempoSessao, setTempoSessao] = useState("");
  const [atividades, setAtividades] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  useEffect(() => {
    if (!idFichaSelecionada) {
      setSugestao(undefined);
      return;
    }
    setSugestao(undefined);
    window.api.ia.obterSugestao(idFichaSelecionada).then((s) => {
      setSugestao(s ?? null);
      setTempoSessao(s?.Tempo_Sessao ?? "");
      setAtividades(s?.Atividades ?? "");
      setObservacoes(s?.Observacoes ?? "");
    });
  }, [idFichaSelecionada]);

  function salvarEntrada(patch: { tempoSessao?: string; atividades?: string; observacoes?: string }): void {
    if (!idFichaSelecionada) return;
    const novoTempoSessao = patch.tempoSessao ?? tempoSessao;
    const novasAtividades = patch.atividades ?? atividades;
    const novasObservacoes = patch.observacoes ?? observacoes;
    window.api.ia.salvarEntrada(idFichaSelecionada, {
      tempoSessao: novoTempoSessao || null,
      atividades: novasAtividades || null,
      observacoes: novasObservacoes || null,
    });
  }

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

  async function exportar(formato: "docx" | "pdf"): Promise<void> {
    if (!idFichaSelecionada) return;
    setEstadoExportacao({ tipo: "gerando", formato });
    try {
      if (formato === "docx") {
        await window.api.exportar.intervencaoDocx(idFichaSelecionada);
      } else {
        await window.api.exportar.intervencaoPdf(idFichaSelecionada);
      }
      setEstadoExportacao({ tipo: "ocioso" });
    } catch (erro) {
      setEstadoExportacao({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  const fichaSelecionada = fichas?.find((f) => f.ID_Ficha === idFichaSelecionada);
  const jaTemResultado = !!sugestao?.Objetivo_Gerado;

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

      {idFichaSelecionada && sugestao !== undefined && (
        <Card>
          <div className="formulario-secao__grid">
            <Select
              id="sugestao_tempo_sessao"
              rotulo="Tempo de sessão"
              opcoes={[...TEMPOS_SESSAO]}
              valor={tempoSessao}
              onChange={(valor) => {
                setTempoSessao(valor);
                salvarEntrada({ tempoSessao: valor });
              }}
            />
          </div>
          <FormField
            id="sugestao_atividades"
            rotulo="Atividades"
            tipo="texto_longo"
            valor={atividades}
            onChange={(valor) => {
              setAtividades(valor);
              salvarEntrada({ atividades: valor });
            }}
          />
          <FormField
            id="sugestao_observacoes"
            rotulo="Observações (opcional)"
            tipo="texto_longo"
            valor={observacoes}
            onChange={(valor) => {
              setObservacoes(valor);
              salvarEntrada({ observacoes: valor });
            }}
          />

          <div style={{ marginTop: 16 }}>
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
            <Button onClick={gerar} disabled={!atividades.trim() || estado.tipo === "gerando"}>
              {estado.tipo === "gerando" ? "Gerando…" : jaTemResultado ? "Gerar novamente" : "Gerar sugestão"}
            </Button>
          </div>
        </Card>
      )}

      {jaTemResultado && sugestao && (
        <Card>
          <p style={{ fontSize: 12, color: "var(--cor-texto-suave)", marginBottom: 12 }}>
            Gerado em {formatarDataHora(sugestao.Gerado_Em)}
          </p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Objetivo da intervenção</div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{sugestao.Objetivo_Gerado}</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Materiais</div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{sugestao.Materiais_Gerado || "—"}</p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Button
              variante="secundario"
              onClick={() => exportar("docx")}
              disabled={estadoExportacao.tipo === "gerando"}
            >
              {estadoExportacao.tipo === "gerando" && estadoExportacao.formato === "docx"
                ? "Gerando…"
                : "Exportar Word (.docx)"}
            </Button>
            <Button
              variante="secundario"
              onClick={() => exportar("pdf")}
              disabled={estadoExportacao.tipo === "gerando"}
            >
              {estadoExportacao.tipo === "gerando" && estadoExportacao.formato === "pdf" ? "Gerando…" : "Exportar PDF"}
            </Button>
          </div>
          {estadoExportacao.tipo === "erro" && (
            <p style={{ color: "var(--cor-perigo)", marginTop: 12 }}>Erro ao exportar: {estadoExportacao.mensagem}</p>
          )}
        </Card>
      )}
    </ScreenContainer>
  );
}
