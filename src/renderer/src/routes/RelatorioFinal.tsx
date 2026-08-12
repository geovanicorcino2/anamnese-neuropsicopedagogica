import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Ficha, RelatorioFinal as RelatorioFinalTipo, SugestaoIA } from "@core/db/types";
import {
  AVALIACAO_ATENCAO_OPCOES,
  AVALIACAO_INTERACAO_OPCOES,
  AVALIACAO_MOTIVACAO_OPCOES,
  OBJETIVO_ALCANCADO_OPCOES,
} from "@core/data/relatorioFinal";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { FormField } from "../components/FormField";
import { formatarDataHora } from "../utils/formatar";

type Estado = { tipo: "ocioso" } | { tipo: "gerando" } | { tipo: "erro"; mensagem: string };
type EstadoExportacao = { tipo: "ocioso" } | { tipo: "gerando"; formato: "docx" | "pdf" } | { tipo: "erro"; mensagem: string };

export function RelatorioFinal(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [idFichaSelecionada, setIdFichaSelecionada] = useState("");
  const [sugestaoIntervencao, setSugestaoIntervencao] = useState<SugestaoIA | null | undefined>(undefined);
  const [relatorio, setRelatorio] = useState<RelatorioFinalTipo | null | undefined>(undefined);
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [estadoExportacao, setEstadoExportacao] = useState<EstadoExportacao>({ tipo: "ocioso" });

  const [objetivoAlcancado, setObjetivoAlcancado] = useState("");
  const [avaliacaoAtencao, setAvaliacaoAtencao] = useState("");
  const [avaliacaoMotivacao, setAvaliacaoMotivacao] = useState("");
  const [avaliacaoInteracao, setAvaliacaoInteracao] = useState("");
  const [observacoesFinais, setObservacoesFinais] = useState("");

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  useEffect(() => {
    if (!idFichaSelecionada) {
      setSugestaoIntervencao(undefined);
      setRelatorio(undefined);
      return;
    }
    setSugestaoIntervencao(undefined);
    setRelatorio(undefined);
    window.api.ia.obterSugestao(idFichaSelecionada).then((s) => setSugestaoIntervencao(s ?? null));
    window.api.relatorioFinal.obter(idFichaSelecionada).then((r) => {
      setRelatorio(r ?? null);
      setObjetivoAlcancado(r?.Objetivo_Alcancado ?? "");
      setAvaliacaoAtencao(r?.Avaliacao_Atencao ?? "");
      setAvaliacaoMotivacao(r?.Avaliacao_Motivacao ?? "");
      setAvaliacaoInteracao(r?.Avaliacao_Interacao ?? "");
      setObservacoesFinais(r?.Observacoes_Finais ?? "");
    });
  }, [idFichaSelecionada]);

  function salvarEntrada(patch: {
    objetivoAlcancado?: string;
    avaliacaoAtencao?: string;
    avaliacaoMotivacao?: string;
    avaliacaoInteracao?: string;
    observacoesFinais?: string;
  }): void {
    if (!idFichaSelecionada) return;
    window.api.relatorioFinal.salvarEntrada(idFichaSelecionada, {
      objetivoAlcancado: (patch.objetivoAlcancado ?? objetivoAlcancado) || null,
      avaliacaoAtencao: (patch.avaliacaoAtencao ?? avaliacaoAtencao) || null,
      avaliacaoMotivacao: (patch.avaliacaoMotivacao ?? avaliacaoMotivacao) || null,
      avaliacaoInteracao: (patch.avaliacaoInteracao ?? avaliacaoInteracao) || null,
      observacoesFinais: (patch.observacoesFinais ?? observacoesFinais) || null,
    });
  }

  async function gerar(): Promise<void> {
    if (!idFichaSelecionada) return;
    setEstado({ tipo: "gerando" });
    try {
      const novo = await window.api.relatorioFinal.gerar(idFichaSelecionada);
      setRelatorio(novo);
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
        await window.api.exportar.relatorioFinalDocx(idFichaSelecionada);
      } else {
        await window.api.exportar.relatorioFinalPdf(idFichaSelecionada);
      }
      setEstadoExportacao({ tipo: "ocioso" });
    } catch (erro) {
      setEstadoExportacao({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  const fichaSelecionada = fichas?.find((f) => f.ID_Ficha === idFichaSelecionada);
  const jaTemResultado = !!relatorio?.Relatorio_Gerado;
  const intervencaoPronta = !!sugestaoIntervencao?.Objetivo_Gerado;
  const camposObrigatoriosPreenchidos =
    !!objetivoAlcancado && !!avaliacaoAtencao && !!avaliacaoMotivacao && !!avaliacaoInteracao;

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Relatório Final"
        subtitulo="Análise por IA da anamnese, da Sugestão de Intervenção e da avaliação do acompanhamento — sempre uma sugestão inicial, a decisão é do profissional"
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

      {idFichaSelecionada && sugestaoIntervencao !== undefined && !intervencaoPronta && (
        <Card>
          <p style={{ marginBottom: 12 }}>
            Gere a Sugestão de Intervenção desta ficha antes de preencher o relatório final.
          </p>
          <Link to="/sugestoes" style={{ color: "var(--cor-roxo-escuro)" }}>
            Ir para Sugestões de Intervenção →
          </Link>
        </Card>
      )}

      {idFichaSelecionada && intervencaoPronta && relatorio !== undefined && (
        <Card>
          <div className="formulario-secao__grid">
            <Select
              id="relatorio_objetivo_alcancado"
              rotulo="Objetivo alcançado"
              opcoes={[...OBJETIVO_ALCANCADO_OPCOES]}
              valor={objetivoAlcancado}
              onChange={(valor) => {
                setObjetivoAlcancado(valor);
                salvarEntrada({ objetivoAlcancado: valor });
              }}
            />
            <Select
              id="relatorio_avaliacao_atencao"
              rotulo="Avaliação de atenção"
              opcoes={[...AVALIACAO_ATENCAO_OPCOES]}
              valor={avaliacaoAtencao}
              onChange={(valor) => {
                setAvaliacaoAtencao(valor);
                salvarEntrada({ avaliacaoAtencao: valor });
              }}
            />
            <Select
              id="relatorio_avaliacao_motivacao"
              rotulo="Avaliação de motivação"
              opcoes={[...AVALIACAO_MOTIVACAO_OPCOES]}
              valor={avaliacaoMotivacao}
              onChange={(valor) => {
                setAvaliacaoMotivacao(valor);
                salvarEntrada({ avaliacaoMotivacao: valor });
              }}
            />
            <Select
              id="relatorio_avaliacao_interacao"
              rotulo="Avaliação de interação"
              opcoes={[...AVALIACAO_INTERACAO_OPCOES]}
              valor={avaliacaoInteracao}
              onChange={(valor) => {
                setAvaliacaoInteracao(valor);
                salvarEntrada({ avaliacaoInteracao: valor });
              }}
            />
          </div>
          <FormField
            id="relatorio_observacoes_finais"
            rotulo="Observações finais (opcional)"
            tipo="texto_longo"
            valor={observacoesFinais}
            onChange={(valor) => {
              setObservacoesFinais(valor);
              salvarEntrada({ observacoesFinais: valor });
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
            <Button onClick={gerar} disabled={!camposObrigatoriosPreenchidos || estado.tipo === "gerando"}>
              {estado.tipo === "gerando" ? "Gerando…" : jaTemResultado ? "Gerar novamente" : "Gerar relatório final"}
            </Button>
          </div>
        </Card>
      )}

      {jaTemResultado && relatorio && (
        <Card>
          <p style={{ fontSize: 12, color: "var(--cor-texto-suave)", marginBottom: 12 }}>
            Gerado em {formatarDataHora(relatorio.Gerado_Em)}
          </p>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{relatorio.Relatorio_Gerado}</p>

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
