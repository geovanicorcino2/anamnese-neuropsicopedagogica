import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PlanoTerapeutico } from "@core/db/types";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { EmptyState } from "../components/EmptyState";
import { AnexosSecao } from "../components/AnexosSecao";
import { formatarData, formatarDataHora } from "../utils/formatar";

type Estado = { tipo: "ocioso" } | { tipo: "gerando" } | { tipo: "erro"; mensagem: string };
type EstadoExportacao = { tipo: "ocioso" } | { tipo: "gerando"; formato: "docx" | "pdf" } | { tipo: "erro"; mensagem: string };

const SECOES: Array<{ campo: keyof PatchCampos; rotulo: string }> = [
  { campo: "diagnostico", rotulo: "Diagnóstico" },
  { campo: "anamneseResumo", rotulo: "Anamnese" },
  { campo: "protocolosAvaliacao", rotulo: "Protocolos de avaliação utilizados" },
  { campo: "capacidadesInteresses", rotulo: "Capacidades, interesses" },
  { campo: "necessidades", rotulo: "Necessidades" },
  { campo: "metasPrazos", rotulo: "Metas e prazos" },
  { campo: "recursosEstrategias", rotulo: "Recursos/estratégias" },
  { campo: "treinamentoParental", rotulo: "Treinamento parental" },
  { campo: "profissionaisAcompanham", rotulo: "Profissionais que a acompanham" },
  { campo: "frequenciaAtendimentos", rotulo: "Quando e como são realizados os atendimentos" },
];

interface PatchCampos {
  diagnostico: string | null;
  anamneseResumo: string | null;
  protocolosAvaliacao: string | null;
  capacidadesInteresses: string | null;
  necessidades: string | null;
  metasPrazos: string | null;
  recursosEstrategias: string | null;
  treinamentoParental: string | null;
  profissionaisAcompanham: string | null;
  frequenciaAtendimentos: string | null;
}

const COLUNA_POR_CAMPO: Record<keyof PatchCampos, keyof PlanoTerapeutico> = {
  diagnostico: "Diagnostico",
  anamneseResumo: "Anamnese_Resumo",
  protocolosAvaliacao: "Protocolos_Avaliacao",
  capacidadesInteresses: "Capacidades_Interesses",
  necessidades: "Necessidades",
  metasPrazos: "Metas_Prazos",
  recursosEstrategias: "Recursos_Estrategias",
  treinamentoParental: "Treinamento_Parental",
  profissionaisAcompanham: "Profissionais_Acompanham",
  frequenciaAtendimentos: "Frequencia_Atendimentos",
};

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

interface EntradaProps {
  plano: PlanoTerapeutico;
  idFicha: string;
  aberto: boolean;
  onAlternar: () => void;
  onAtualizado: (novo: PlanoTerapeutico) => void;
  onRemovido: () => void;
}

function EntradaPlano({ plano, idFicha, aberto, onAlternar, onAtualizado, onRemovido }: EntradaProps): React.JSX.Element {
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });
  const [estadoExportacao, setEstadoExportacao] = useState<EstadoExportacao>({ tipo: "ocioso" });

  async function salvar(campo: keyof PatchCampos, valor: string): Promise<void> {
    const novo = await window.api.planosTerapeuticos.atualizar(plano.ID_Plano, idFicha, { [campo]: valor });
    onAtualizado(novo);
  }

  async function gerar(): Promise<void> {
    setEstado({ tipo: "gerando" });
    try {
      const novo = await window.api.planosTerapeuticos.gerar(plano.ID_Plano);
      onAtualizado(novo);
      setEstado({ tipo: "ocioso" });
    } catch (erro) {
      setEstado({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  async function exportar(formato: "docx" | "pdf"): Promise<void> {
    setEstadoExportacao({ tipo: "gerando", formato });
    try {
      if (formato === "docx") await window.api.exportar.planoTerapeuticoDocx(plano.ID_Plano);
      else await window.api.exportar.planoTerapeuticoPdf(plano.ID_Plano);
      setEstadoExportacao({ tipo: "ocioso" });
    } catch (erro) {
      setEstadoExportacao({ tipo: "erro", mensagem: erro instanceof Error ? erro.message : String(erro) });
    }
  }

  async function remover(): Promise<void> {
    await window.api.planosTerapeuticos.remover(plano.ID_Plano, idFicha);
    onRemovido();
  }

  const temResultado = !!plano.Diagnostico;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onAlternar}>
        <div>
          <div style={{ fontWeight: 700 }}>Plano de {formatarData(plano.Data_Planejamento)}</div>
          {plano.Gerado_Em && (
            <div style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Gerado em {formatarDataHora(plano.Gerado_Em)}</div>
          )}
        </div>
        <span style={{ color: "var(--cor-roxo-escuro)" }}>{aberto ? "Fechar ▲" : "Abrir ▼"}</span>
      </div>

      {aberto && (
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
          <Button onClick={gerar} disabled={estado.tipo === "gerando"}>
            {estado.tipo === "gerando" ? "Gerando…" : temResultado ? "Gerar novamente (rascunho por IA)" : "Gerar rascunho por IA"}
          </Button>

          {SECOES.map(({ campo, rotulo }) => (
            <FormField
              key={campo}
              id={`${campo}_${plano.ID_Plano}`}
              rotulo={rotulo}
              tipo="texto_longo"
              valor={(plano[COLUNA_POR_CAMPO[campo]] as string | null) ?? ""}
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
              Remover plano
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

export function PacientePlanoTerapeutico(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [lista, setLista] = useState<PlanoTerapeutico[] | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [dataPlanejamento, setDataPlanejamento] = useState(hoje());
  const [criando, setCriando] = useState(false);

  async function carregar(): Promise<void> {
    if (!id) return;
    setLista(await window.api.planosTerapeuticos.listar(id));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return <p>Paciente inválido.</p>;

  async function criarPlano(): Promise<void> {
    if (!id || !dataPlanejamento) return;
    setCriando(true);
    try {
      const novo = await window.api.planosTerapeuticos.criar(id, dataPlanejamento);
      setLista((atual) => [novo, ...(atual ?? [])]);
      setExpandidoId(novo.ID_Plano);
    } finally {
      setCriando(false);
    }
  }

  return (
    <>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Novo plano terapêutico (reavaliação semestral)</div>
        <div className="formulario-secao__grid">
          <FormField
            id="plano_data"
            rotulo="Data do planejamento"
            tipo="data"
            valor={dataPlanejamento}
            onChange={setDataPlanejamento}
            obrigatorio
          />
        </div>
        <Button onClick={criarPlano} disabled={!dataPlanejamento || criando}>
          {criando ? "Criando…" : "+ Novo plano terapêutico"}
        </Button>
      </Card>

      {lista !== null && lista.length === 0 && (
        <Card>
          <EmptyState titulo="Nenhum plano terapêutico ainda" descricao="Refeito a cada ~6 meses de acompanhamento." />
        </Card>
      )}

      {lista?.map((plano) => (
        <EntradaPlano
          key={plano.ID_Plano}
          plano={plano}
          idFicha={id}
          aberto={expandidoId === plano.ID_Plano}
          onAlternar={() => setExpandidoId((atual) => (atual === plano.ID_Plano ? null : plano.ID_Plano))}
          onAtualizado={(novo) => setLista((atual) => atual?.map((p) => (p.ID_Plano === novo.ID_Plano ? novo : p)) ?? null)}
          onRemovido={() => {
            setLista((atual) => atual?.filter((p) => p.ID_Plano !== plano.ID_Plano) ?? null);
            setExpandidoId(null);
          }}
        />
      ))}

      <AnexosSecao idFicha={id} categoria="plano_terapeutico" />
    </>
  );
}
