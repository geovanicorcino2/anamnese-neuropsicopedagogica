import { useEffect, useState } from "react";
import type { Agendamento, Ficha } from "@core/db/types";
import { adicionarDias, formatarDataIso, gerarDiasDaSemana, inicioDaSemana } from "@core/services/semanaUtils";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { FormField } from "../components/FormField";
import { formatarData } from "../utils/formatar";

const NOMES_DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function Agenda(): React.JSX.Element {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [dataReferencia, setDataReferencia] = useState(() => new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[] | null>(null);

  const [nomeFichaSelecionada, setNomeFichaSelecionada] = useState("");
  const [nomeLivre, setNomeLivre] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const inicioSemana = inicioDaSemana(dataReferencia);
  const fimSemana = adicionarDias(inicioSemana, 6);
  const diasDaSemana = gerarDiasDaSemana(inicioSemana);

  useEffect(() => {
    window.api.fichas.listar().then(setFichas);
  }, []);

  async function carregarSemana(): Promise<void> {
    const lista = await window.api.agendamentos.listarIntervalo(
      formatarDataIso(inicioSemana),
      formatarDataIso(fimSemana),
    );
    setAgendamentos(lista);
  }

  useEffect(() => {
    carregarSemana();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatarDataIso(inicioSemana)]);

  async function agendar(): Promise<void> {
    const idFicha = fichas?.find((f) => f.Nome_Crianca === nomeFichaSelecionada)?.ID_Ficha ?? null;
    if (!idFicha && !nomeLivre.trim()) return;
    if (!data || !horaInicio || !horaFim || horaFim <= horaInicio) return;

    setSalvando(true);
    setErro(null);
    try {
      await window.api.agendamentos.criar({
        idFicha,
        nomePacienteLivre: idFicha ? null : nomeLivre.trim(),
        data,
        horaInicio,
        horaFim,
        observacoes: observacoes || null,
      });
      setNomeFichaSelecionada("");
      setNomeLivre("");
      setHoraInicio("");
      setHoraFim("");
      setObservacoes("");
      await carregarSemana();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string): Promise<void> {
    await window.api.agendamentos.remover(id);
    carregarSemana();
  }

  function nomePaciente(agendamento: Agendamento): string {
    if (agendamento.ID_Ficha) {
      return fichas?.find((f) => f.ID_Ficha === agendamento.ID_Ficha)?.Nome_Crianca ?? "Ficha removida";
    }
    return agendamento.Nome_Paciente_Livre ?? "—";
  }

  const pacienteValido = !!nomeFichaSelecionada || !!nomeLivre.trim();
  const horariosValidos = !!data && !!horaInicio && !!horaFim && horaFim > horaInicio;

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Agenda"
        subtitulo="Agendamento de sessões da semana"
        acoes={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variante="secundario" onClick={() => setDataReferencia(adicionarDias(dataReferencia, -7))}>
              ← Semana anterior
            </Button>
            <Button variante="secundario" onClick={() => setDataReferencia(new Date())}>
              Hoje
            </Button>
            <Button variante="secundario" onClick={() => setDataReferencia(adicionarDias(dataReferencia, 7))}>
              Semana seguinte →
            </Button>
          </div>
        }
      />

      <Card>
        <p style={{ marginBottom: 12, fontWeight: 600 }}>
          Semana de {formatarData(formatarDataIso(inicioSemana))} a {formatarData(formatarDataIso(fimSemana))}
        </p>
        <div className="formulario-secao__grid">
          {fichas !== null && (
            <Select
              id="agendamento_ficha"
              rotulo="Paciente cadastrado"
              opcoes={fichas.map((f) => f.Nome_Crianca)}
              valor={nomeFichaSelecionada}
              onChange={setNomeFichaSelecionada}
            />
          )}
          <FormField
            id="agendamento_nome_livre"
            rotulo="Ou nome (paciente sem ficha)"
            tipo="texto"
            valor={nomeLivre}
            onChange={setNomeLivre}
          />
          <FormField id="agendamento_data" rotulo="Data" tipo="data" valor={data} onChange={setData} />
          <FormField id="agendamento_hora_inicio" rotulo="Hora início" tipo="hora" valor={horaInicio} onChange={setHoraInicio} />
          <FormField id="agendamento_hora_fim" rotulo="Hora fim" tipo="hora" valor={horaFim} onChange={setHoraFim} />
        </div>
        <FormField
          id="agendamento_observacoes"
          rotulo="Observações (opcional)"
          tipo="texto_longo"
          valor={observacoes}
          onChange={setObservacoes}
        />
        {erro && <p style={{ color: "var(--cor-perigo)", marginBottom: 12 }}>{erro}</p>}
        <Button onClick={agendar} disabled={!pacienteValido || !horariosValidos || salvando}>
          {salvando ? "Agendando…" : "Agendar"}
        </Button>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
        {diasDaSemana.map((dia, indice) => {
          const dataIso = formatarDataIso(dia);
          const agendamentosDoDia = agendamentos?.filter((a) => a.Data === dataIso) ?? [];
          return (
            <Card key={dataIso}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{NOMES_DIAS[indice]}</div>
              <div style={{ fontSize: 12, color: "var(--cor-texto-suave)", marginBottom: 8 }}>
                {formatarData(dataIso)}
              </div>
              {agendamentosDoDia.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--cor-texto-suave)" }}>Nenhum agendamento</div>
              )}
              {agendamentosDoDia.map((agendamento) => (
                <div
                  key={agendamento.ID_Agendamento}
                  style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--cor-borda)" }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {agendamento.Hora_Inicio}–{agendamento.Hora_Fim}
                  </div>
                  <div style={{ fontSize: 13 }}>{nomePaciente(agendamento)}</div>
                  <Button variante="perigo" onClick={() => remover(agendamento.ID_Agendamento)} style={{ marginTop: 4 }}>
                    Remover
                  </Button>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </ScreenContainer>
  );
}
