import { useEffect, useState } from "react";
import type { Perfil } from "@core/db/types";
import type { ArquivoBackup, PastaNuvemDetectada } from "@main/backup/backupService";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { formatarDataHora } from "../utils/formatar";

const ROTULO_PROVEDOR: Record<string, string> = { onedrive: "OneDrive", googledrive: "Google Drive" };

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Backup(): React.JSX.Element {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [detectadas, setDetectadas] = useState<PastaNuvemDetectada[]>([]);
  const [backups, setBackups] = useState<ArquivoBackup[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function recarregar(): Promise<void> {
    const [p, d] = await Promise.all([window.api.perfil.obter(), window.api.backup.detectarNuvem()]);
    setPerfil(p ?? null);
    setDetectadas(d);
    setBackups(p?.Pasta_Backup ? await window.api.backup.listar() : []);
  }

  useEffect(() => {
    recarregar();
  }, []);

  async function usarDetectada(provedor: "onedrive" | "googledrive"): Promise<void> {
    await window.api.backup.usarPastaDetectada(provedor);
    recarregar();
  }

  async function escolherManual(): Promise<void> {
    const atualizado = await window.api.backup.escolherPastaManual();
    if (atualizado) recarregar();
  }

  async function remover(): Promise<void> {
    await window.api.backup.removerPasta();
    recarregar();
  }

  async function fazerAgora(): Promise<void> {
    setCarregando(true);
    setMensagem(null);
    try {
      await window.api.backup.fazerAgora();
      setMensagem("Backup feito com sucesso.");
      setBackups(await window.api.backup.listar());
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : String(erro));
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarEReiniciar(): Promise<void> {
    const reiniciar = window.confirm("Backup restaurado. O app precisa reiniciar para carregar os dados. Reiniciar agora?");
    if (reiniciar) await window.api.backup.reiniciarApp();
  }

  async function restaurar(caminho: string): Promise<void> {
    const confirmou = window.confirm(
      "Isso vai substituir todos os dados atuais do app pelos dados desse backup. Essa ação não pode ser desfeita. Continuar?",
    );
    if (!confirmou) return;
    await window.api.backup.restaurar(caminho);
    await confirmarEReiniciar();
  }

  async function restaurarOutroArquivo(): Promise<void> {
    const confirmou = window.confirm(
      "Isso vai substituir todos os dados atuais do app pelo arquivo que você escolher. Essa ação não pode ser desfeita. Continuar?",
    );
    if (!confirmou) return;
    const restaurou = await window.api.backup.restaurarViaDialogo();
    if (restaurou) await confirmarEReiniciar();
  }

  if (!perfil) {
    return (
      <ScreenContainer>
        <SectionHeader titulo="Backup" />
        <Card>Carregando…</Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader
        titulo="Backup"
        subtitulo="Protege suas fichas contra perda caso o computador tenha algum problema"
      />

      <Card>
        <p className="campo__rotulo" style={{ marginBottom: 8 }}>
          Pasta de backup
        </p>
        {perfil.Pasta_Backup ? (
          <>
            <p style={{ marginBottom: 12, wordBreak: "break-all" }}>{perfil.Pasta_Backup}</p>
            <Button variante="perigo" onClick={remover}>
              Remover configuração
            </Button>
          </>
        ) : (
          <>
            {detectadas.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                {detectadas.map((d) => (
                  <div
                    key={d.provedor}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                  >
                    <span>
                      Detectamos o <b>{ROTULO_PROVEDOR[d.provedor]}</b> em{" "}
                      <code style={{ wordBreak: "break-all" }}>{d.caminho}</code>
                    </span>
                    <Button onClick={() => usarDetectada(d.provedor)}>Usar esta pasta</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ marginBottom: 12, color: "var(--cor-texto-suave)" }}>
                Não encontramos OneDrive nem Google Drive instalados neste computador.
              </p>
            )}
            <Button variante="secundario" onClick={escolherManual}>
              Escolher outra pasta manualmente
            </Button>
          </>
        )}
      </Card>

      {perfil.Pasta_Backup && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p className="campo__rotulo" style={{ margin: 0 }}>
              Backups
            </p>
            <Button onClick={fazerAgora} disabled={carregando}>
              {carregando ? "Fazendo backup…" : "Fazer backup agora"}
            </Button>
          </div>
          {mensagem && <p style={{ marginBottom: 12 }}>{mensagem}</p>}
          {backups.length === 0 && <p style={{ color: "var(--cor-texto-suave)" }}>Nenhum backup ainda.</p>}
          {backups.map((b) => (
            <div
              key={b.caminho}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--cor-borda)",
              }}
            >
              <div>
                <div>{formatarDataHora(b.modificadoEm)}</div>
                <div style={{ fontSize: 12, color: "var(--cor-texto-suave)" }}>{formatarTamanho(b.tamanho)}</div>
              </div>
              <Button variante="secundario" onClick={() => restaurar(b.caminho)}>
                Restaurar
              </Button>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <Button variante="fantasma" onClick={restaurarOutroArquivo}>
              Restaurar de outro arquivo…
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <p className="campo__rotulo" style={{ marginBottom: 8 }}>
          Ainda não tem OneDrive ou Google Drive?
        </p>
        <p style={{ marginBottom: 12, color: "var(--cor-texto-suave)" }}>
          Baixe um guia rápido com o passo a passo e vídeos de como instalar.
        </p>
        <Button variante="secundario" onClick={() => window.api.backup.baixarGuia()}>
          Baixar guia de instalação (PDF)
        </Button>
      </Card>
    </ScreenContainer>
  );
}
