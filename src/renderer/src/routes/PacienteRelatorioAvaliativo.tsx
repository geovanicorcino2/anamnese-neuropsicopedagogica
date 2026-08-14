import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { RelatorioAvaliativo } from "@core/db/types";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { EmptyState } from "../components/EmptyState";
import { AnexosSecao } from "../components/AnexosSecao";
import { formatarData, formatarDataHora } from "../utils/formatar";

type Estado = { tipo: "ocioso" } | { tipo: "gerando" } | { tipo: "erro"; mensagem: string };
type EstadoExportacao = { tipo: "ocioso" } | { tipo: "gerando"; formato: "docx" | "pdf" } | { tipo: "erro"; mensagem: string };

interface PatchCampos {
  serie: string | null;
  dataEncerramento: string | null;
  objetivoAvaliacao: string | null;
  historicoEscolarFamiliar: string | null;
  aspectosEmocionaisComportamentais: string | null;
  metodologiaAvaliacao: string | null;
  aspectosCognitivosAprendizagem: string | null;
  instrumentosUtilizados: string | null;
  resultadosAvaliacao: string | null;
  intervencoesAplicadas: string | null;
  recomendacoes: string | null;
}

const COLUNA_POR_CAMPO: Record<keyof PatchCampos, keyof RelatorioAvaliativo> = {
  serie: "Serie",
  dataEncerramento: "Data_Encerramento",
  objetivoAvaliacao: "Objetivo_Avaliacao",
  historicoEscolarFamiliar: "Historico_Escolar_Familiar",
  aspectosEmocionaisComportamentais: "Aspectos_Emocionais_Comportamentais",
  metodologiaAvaliacao: "Metodologia_Avaliacao",
  aspectosCognitivosAprendizagem: "Aspectos_Cognitivos_Aprendizagem",
  instrumentosUtilizados: "Instrumentos_Utilizados",
  resultadosAvaliacao: "Resultados_Avaliacao",
  intervencoesAplicadas: "Intervencoes_Aplicadas",
  recomendacoes: "Recomendacoes",
};

const SECOES: Array<{ campo: keyof PatchCampos; rotulo: string }> = [
  { campo: "objetivoAvaliacao", rotulo: "Objetivo da Avaliação" },
  { campo: "historicoEscolarFamiliar", rotulo: "Histórico Escolar e Familiar" },
  { campo: "aspectosEmocionaisComportamentais", rotulo: "Aspectos Emocionais e Comportamentais" },
  { campo: "metodologiaAvaliacao", rotulo: "Metodologia da avaliação" },
  { campo: "aspectosCognitivosAprendizagem", rotulo: "Aspectos Cognitivos e de Aprendizagem" },
  { campo: "instrumentosUtilizados", rotulo: "Instrumentos Utilizados" },
  { campo: "resultadosAvaliacao", rotulo: "Resultados da Avaliação" },
  { campo: "intervencoesAplicadas", rotulo: "Intervenções Aplicadas" },
  { campo: "recomendacoes", rotulo: "Recomendações" },
];

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

interface EntradaProps {
  relatorio: RelatorioAvaliativo;
  idFicha: string;
  aberto: boolean;
  onAlternar: () => void;
  onAtualizado: (novo: RelatorioAvaliativo) => void;
  onRemovido: () => void;
}

function EntradaRelatorio({ relatorio, idFicha, aberto, onAlternar, onAtualizado, onRemovido }: EntradaProps): React.JSX.Element {
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [estadoExportacao, setEstadoExportacao] = useState<EstadoExportacao>({ tipo: "ocioso" });

  async function salvar(campo: keyof PatchCampos, valor: string): Promise<void> {
    const novo = await window.api.relatoriosAvaliativos.atualizar(relatorio.ID_Relatorio, idFicha, { [campo]: valor });
    onAtualizado(novo);
  }

  async function gerar(): Promise<void> {
    setEstado({ tipo: "gerando" });
    try {
      const novo = await window.api.relatoriosAvaliativos.gerar(relatorio.ID_Relatorio);
      onAtualizado(novo);
      setEstado({ tipo: "ocioso" });
    } catch (erro) {
      setEstado({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  async function exportar(formato: "docx" | "pdf"): Promise<void> {
    setEstadoExportacao({ tipo: "gerando", formato });
    try {
      if (formato === "docx") await window.api.exportar.relatorioAvaliativoDocx(relatorio.ID_Relatorio);
      else await window.api.exportar.relatorioAvaliativoPdf(relatorio.ID_Relatorio);
      setEstadoExportacao({ tipo: "ocioso" });
    } catch (erro) {
      setEstadoExportacao({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  async function remover(): Promise<void> {
    await window.api.relatoriosAvaliativos.remover(relatorio.ID_Relatorio, idFicha);
    onRemovido();
  }

  const temResultado = !!relatorio.Objetivo_Avaliacao;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onAlternar}>
        <div>
          <div style={{ fontWeight: 700 }}>
            Avaliação desde {relatorio.Data_Inicio_Avaliacao ? formatarData(relatorio.Data_Inicio_Avaliacao) : "—"}
          </div>
          {relatorio.Gerado_Em && (
            <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Gerado em {formatarDataHora(relatorio.Gerado_Em)}</div>
          )}
        </div>
        <span style={{ color: "var(--cor-roxo-escuro)" }}>{aberto ? "Fechar ▲" : "Abrir ▼"}</span>
      </div>

      {aberto && (
        <div style={{ marginTop: 16 }}>
          <div className="formulario-secao__grid">
            <FormField
              id={`serie_${relatorio.ID_Relatorio}`}
              rotulo="Série/ano escolar"
              tipo="texto"
              valor={relatorio.Serie ?? ""}
              onChange={(valor) => salvar("serie", valor)}
            />
            <FormField
              id={`encerramento_${relatorio.ID_Relatorio}`}
              rotulo="Data de encerramento (ou 'Em intervenção')"
              tipo="texto"
              valor={relatorio.Data_Encerramento ?? ""}
              onChange={(valor) => salvar("dataEncerramento", valor)}
            />
          </div>

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
          <Button onClick={gerar} disabled={estado.tipo === "gerando"}>
            {estado.tipo === "gerando" ? "Gerando…" : temResultado ? "Gerar novamente (rascunho por IA)" : "Gerar rascunho por IA"}
          </Button>

          {SECOES.map(({ campo, rotulo }) => (
            <FormField
              key={campo}
              id={`${campo}_${relatorio.ID_Relatorio}`}
              rotulo={rotulo}
              tipo="texto_longo"
              valor={(relatorio[COLUNA_POR_CAMPO[campo]] as string | null) ?? ""}
              onChange={(valor) => salvar(campo, valor)}
            />
          ))}

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Button variante="secundario" onClick={() => exportar("docx")} disabled={estadoExportacao.tipo === "gerando"}>
              {estadoExportacao.tipo === "gerando" && estadoExportacao.formato === "docx" ? "Gerando…" : "Exportar Word (.docx)"}
            </Button>
            <Button variante="secundario" onClick={() => exportar("pdf")} disabled={estadoExportacao.tipo === "gerando"}>
              {estadoExportacao.tipo === "gerando" && estadoExportacao.formato === "pdf" ? "Gerando…" : "Exportar PDF"}
            </Button>
            <Button variante="perigo" onClick={remover}>
              Remover relatório
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

export function PacienteRelatorioAvaliativo(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [lista, setLista] = useState<RelatorioAvaliativo[] | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [dataInicioAvaliacao, setDataInicioAvaliacao] = useState(hoje());
  const [criando, setCriando] = useState(false);

  async function carregar(): Promise<void> {
    if (!id) return;
    setLista(await window.api.relatoriosAvaliativos.listar(id));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return <p>Paciente inválido.</p>;

  async function criarRelatorio(): Promise<void> {
    if (!id) return;
    setCriando(true);
    try {
      const novo = await window.api.relatoriosAvaliativos.criar(id, dataInicioAvaliacao || null);
      setLista((atual) => [novo, ...(atual ?? [])]);
      setExpandidoId(novo.ID_Relatorio);
    } finally {
      setCriando(false);
    }
  }

  return (
    <>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Novo relatório avaliativo</div>
        <div className="formulario-secao__grid">
          <FormField
            id="relatorio_data_inicio"
            rotulo="Data de início da avaliação"
            tipo="data"
            valor={dataInicioAvaliacao}
            onChange={setDataInicioAvaliacao}
          />
        </div>
        <Button onClick={criarRelatorio} disabled={criando}>
          {criando ? "Criando…" : "+ Novo relatório avaliativo"}
        </Button>
      </Card>

      {lista !== null && lista.length === 0 && (
        <Card>
          <EmptyState titulo="Nenhum relatório avaliativo ainda" descricao="Relatório narrativo da evolução do paciente." />
        </Card>
      )}

      {lista?.map((relatorio) => (
        <EntradaRelatorio
          key={relatorio.ID_Relatorio}
          relatorio={relatorio}
          idFicha={id}
          aberto={expandidoId === relatorio.ID_Relatorio}
          onAlternar={() => setExpandidoId((atual) => (atual === relatorio.ID_Relatorio ? null : relatorio.ID_Relatorio))}
          onAtualizado={(novo) =>
            setLista((atual) => atual?.map((r) => (r.ID_Relatorio === novo.ID_Relatorio ? novo : r)) ?? null)
          }
          onRemovido={() => {
            setLista((atual) => atual?.filter((r) => r.ID_Relatorio !== relatorio.ID_Relatorio) ?? null);
            setExpandidoId(null);
          }}
        />
      ))}

      <AnexosSecao idFicha={id} categoria="relatorio_avaliativo" />
    </>
  );
}
