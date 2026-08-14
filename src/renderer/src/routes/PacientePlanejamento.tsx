import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PlanejamentoIntervencao } from "@core/db/types";
import {
  AVALIACAO_ATENCAO_OPCOES,
  AVALIACAO_INTERACAO_OPCOES,
  AVALIACAO_MOTIVACAO_OPCOES,
  OBJETIVO_SESSAO_OPCOES,
  TEMPOS_SESSAO,
} from "@core/data/planejamentoIntervencao";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Select } from "../components/Select";
import { EmptyState } from "../components/EmptyState";
import { AnexosSecao } from "../components/AnexosSecao";
import { formatarData } from "../utils/formatar";

type EstadoGeracao = { tipo: "ocioso" } | { tipo: "gerando" } | { tipo: "erro"; mensagem: string };
type EstadoExportacao = { tipo: "ocioso" } | { tipo: "gerando"; formato: "docx" | "pdf" } | { tipo: "erro"; mensagem: string };

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

interface EntradaEntry {
  planejamento: PlanejamentoIntervencao;
  idFicha: string;
  aberto: boolean;
  onAlternar: () => void;
  onAtualizado: (novo: PlanejamentoIntervencao) => void;
  onRemovido: () => void;
}

function EntradaPlanejamento({ planejamento, idFicha, aberto, onAlternar, onAtualizado, onRemovido }: EntradaEntry): React.JSX.Element {
  const [tempoSessao, setTempoSessao] = useState(planejamento.Tempo_Sessao ?? "");
  const [atividades, setAtividades] = useState(planejamento.Atividades ?? "");
  const [avaliacaoAtencao, setAvaliacaoAtencao] = useState(planejamento.Avaliacao_Atencao ?? "");
  const [avaliacaoMotivacao, setAvaliacaoMotivacao] = useState(planejamento.Avaliacao_Motivacao ?? "");
  const [avaliacaoInteracao, setAvaliacaoInteracao] = useState(planejamento.Avaliacao_Interacao ?? "");
  const [objetivoSessao, setObjetivoSessao] = useState(planejamento.Objetivo_Sessao ?? "");
  const [observacoes, setObservacoes] = useState(planejamento.Observacoes ?? "");
  const [estadoGeracao, setEstadoGeracao] = useState<EstadoGeracao>({ tipo: "ocioso" });
  const [estadoExportacao, setEstadoExportacao] = useState<EstadoExportacao>({ tipo: "ocioso" });

  async function salvar(patch: Record<string, string | null>): Promise<void> {
    const novo = await window.api.planejamentos.atualizar(planejamento.ID_Planejamento, idFicha, patch);
    onAtualizado(novo);
  }

  async function gerar(): Promise<void> {
    setEstadoGeracao({ tipo: "gerando" });
    try {
      const novo = await window.api.planejamentos.gerar(planejamento.ID_Planejamento);
      onAtualizado(novo);
      setEstadoGeracao({ tipo: "ocioso" });
    } catch (erro) {
      setEstadoGeracao({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  async function exportar(formato: "docx" | "pdf"): Promise<void> {
    setEstadoExportacao({ tipo: "gerando", formato });
    try {
      if (formato === "docx") await window.api.exportar.planejamentoDocx(planejamento.ID_Planejamento);
      else await window.api.exportar.planejamentoPdf(planejamento.ID_Planejamento);
      setEstadoExportacao({ tipo: "ocioso" });
    } catch (erro) {
      setEstadoExportacao({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  async function remover(): Promise<void> {
    await window.api.planejamentos.remover(planejamento.ID_Planejamento, idFicha);
    onRemovido();
  }

  const temResultado = !!planejamento.Objetivo_Gerado;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onAlternar}>
        <div>
          <div style={{ fontWeight: 700 }}>Sessão de {formatarData(planejamento.Data_Sessao)}</div>
          <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
            {planejamento.Tempo_Sessao || "Tempo não informado"}
            {planejamento.Objetivo_Sessao ? ` · ${planejamento.Objetivo_Sessao}` : ""}
          </div>
        </div>
        <span style={{ color: "var(--cor-roxo-escuro)" }}>{aberto ? "Fechar ▲" : "Abrir ▼"}</span>
      </div>

      {aberto && (
        <div style={{ marginTop: 16 }}>
          <div className="formulario-secao__grid">
            <Select
              id={`tempo_${planejamento.ID_Planejamento}`}
              rotulo="Tempo de sessão"
              opcoes={[...TEMPOS_SESSAO]}
              valor={tempoSessao}
              onChange={(valor) => {
                setTempoSessao(valor);
                salvar({ tempoSessao: valor });
              }}
            />
          </div>
          <FormField
            id={`atividades_${planejamento.ID_Planejamento}`}
            rotulo="Atividades"
            tipo="texto_longo"
            valor={atividades}
            onChange={(valor) => {
              setAtividades(valor);
              salvar({ atividades: valor });
            }}
          />

          <div style={{ marginTop: 12, marginBottom: 12 }}>
            {estadoGeracao.tipo === "erro" && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "var(--cor-perigo)" }}>{estadoGeracao.mensagem}</p>
                {estadoGeracao.mensagem.includes("IA ainda não configurada") && (
                  <Link to="/perfil" style={{ color: "var(--cor-roxo-escuro)" }}>
                    Ir para o Perfil e configurar a IA →
                  </Link>
                )}
              </div>
            )}
            <Button onClick={gerar} disabled={!atividades.trim() || estadoGeracao.tipo === "gerando"}>
              {estadoGeracao.tipo === "gerando" ? "Gerando…" : temResultado ? "Gerar novamente" : "Gerar objetivo e materiais"}
            </Button>
          </div>

          {temResultado && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Objetivo da intervenção</div>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{planejamento.Objetivo_Gerado}</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Materiais</div>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{planejamento.Materiais_Gerado || "—"}</p>
              </div>
            </>
          )}

          <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>Avaliação pós-sessão</div>
          <div className="formulario-secao__grid">
            <Select
              id={`atencao_${planejamento.ID_Planejamento}`}
              rotulo="Atenção"
              opcoes={[...AVALIACAO_ATENCAO_OPCOES]}
              valor={avaliacaoAtencao}
              onChange={(valor) => {
                setAvaliacaoAtencao(valor);
                salvar({ avaliacaoAtencao: valor });
              }}
            />
            <Select
              id={`motivacao_${planejamento.ID_Planejamento}`}
              rotulo="Motivação"
              opcoes={[...AVALIACAO_MOTIVACAO_OPCOES]}
              valor={avaliacaoMotivacao}
              onChange={(valor) => {
                setAvaliacaoMotivacao(valor);
                salvar({ avaliacaoMotivacao: valor });
              }}
            />
            <Select
              id={`interacao_${planejamento.ID_Planejamento}`}
              rotulo="Interação"
              opcoes={[...AVALIACAO_INTERACAO_OPCOES]}
              valor={avaliacaoInteracao}
              onChange={(valor) => {
                setAvaliacaoInteracao(valor);
                salvar({ avaliacaoInteracao: valor });
              }}
            />
            <Select
              id={`objetivo_sessao_${planejamento.ID_Planejamento}`}
              rotulo="Objetivo da sessão"
              opcoes={[...OBJETIVO_SESSAO_OPCOES]}
              valor={objetivoSessao}
              onChange={(valor) => {
                setObjetivoSessao(valor);
                salvar({ objetivoSessao: valor });
              }}
            />
          </div>
          <FormField
            id={`observacoes_${planejamento.ID_Planejamento}`}
            rotulo="Observações (opcional)"
            tipo="texto_longo"
            valor={observacoes}
            onChange={(valor) => {
              setObservacoes(valor);
              salvar({ observacoes: valor });
            }}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Button variante="secundario" onClick={() => exportar("docx")} disabled={estadoExportacao.tipo === "gerando"}>
              {estadoExportacao.tipo === "gerando" && estadoExportacao.formato === "docx" ? "Gerando…" : "Exportar Word (.docx)"}
            </Button>
            <Button variante="secundario" onClick={() => exportar("pdf")} disabled={estadoExportacao.tipo === "gerando"}>
              {estadoExportacao.tipo === "gerando" && estadoExportacao.formato === "pdf" ? "Gerando…" : "Exportar PDF"}
            </Button>
            <Button variante="perigo" onClick={remover}>
              Remover sessão
            </Button>
          </div>
          {estadoExportacao.tipo === "erro" && (
            <p style={{ color: "var(--cor-perigo)", marginTop: 12 }}>Erro ao exportar: {estadoExportacao.mensagem}</p>
          )}
        </div>
      )}
    </Card>
  );
}

export function PacientePlanejamento(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [lista, setLista] = useState<PlanejamentoIntervencao[] | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [dataSessao, setDataSessao] = useState(hoje());
  const [serie, setSerie] = useState("");
  const [criando, setCriando] = useState(false);

  async function carregar(): Promise<void> {
    if (!id) return;
    setLista(await window.api.planejamentos.listar(id));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return <p>Paciente inválido.</p>;

  async function criarSessao(): Promise<void> {
    if (!id || !dataSessao) return;
    setCriando(true);
    try {
      const novo = await window.api.planejamentos.criar({
        idFicha: id,
        dataSessao,
        serie: serie || null,
        tempoSessao: null,
        atividades: null,
      });
      setLista((atual) => [novo, ...(atual ?? [])]);
      setExpandidoId(novo.ID_Planejamento);
    } finally {
      setCriando(false);
    }
  }

  return (
    <>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Nova sessão</div>
        <div className="formulario-secao__grid">
          <FormField id="planejamento_data" rotulo="Data da sessão" tipo="data" valor={dataSessao} onChange={setDataSessao} obrigatorio />
          <FormField id="planejamento_serie" rotulo="Série (opcional)" tipo="texto" valor={serie} onChange={setSerie} />
        </div>
        <Button onClick={criarSessao} disabled={!dataSessao || criando}>
          {criando ? "Criando…" : "+ Nova sessão"}
        </Button>
      </Card>

      {lista !== null && lista.length === 0 && (
        <Card>
          <EmptyState titulo="Nenhuma sessão registrada ainda" descricao="Cada atendimento vira um registro aqui." />
        </Card>
      )}

      {lista?.map((planejamento) => (
        <EntradaPlanejamento
          key={planejamento.ID_Planejamento}
          planejamento={planejamento}
          idFicha={id}
          aberto={expandidoId === planejamento.ID_Planejamento}
          onAlternar={() =>
            setExpandidoId((atual) => (atual === planejamento.ID_Planejamento ? null : planejamento.ID_Planejamento))
          }
          onAtualizado={(novo) => setLista((atual) => atual?.map((p) => (p.ID_Planejamento === novo.ID_Planejamento ? novo : p)) ?? null)}
          onRemovido={() => {
            setLista((atual) => atual?.filter((p) => p.ID_Planejamento !== planejamento.ID_Planejamento) ?? null);
            setExpandidoId(null);
          }}
        />
      ))}

      <AnexosSecao idFicha={id} categoria="planejamento_intervencao" />
    </>
  );
}
