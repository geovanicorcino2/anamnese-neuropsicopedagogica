import { useEffect, useState } from "react";
import type { Perfil as PerfilType } from "@core/db/types";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";

export function Perfil(): React.JSX.Element {
  const [perfil, setPerfil] = useState<PerfilType | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    window.api.perfil.obter().then((p) => setPerfil(p ?? null));
  }, []);

  async function salvar(): Promise<void> {
    if (!perfil) return;
    await window.api.perfil.atualizar({
      Nome_Profissional: perfil.Nome_Profissional,
      Titulo: perfil.Titulo,
      Nome_Clinica: perfil.Nome_Clinica,
    });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <ScreenContainer>
      <SectionHeader titulo="Perfil" subtitulo="Dados que aparecem no timbre dos documentos exportados" />
      <Card>
        {!perfil && <p>Carregando…</p>}
        {perfil && (
          <>
            <FormField
              id="nome_profissional"
              rotulo="Nome do(a) profissional"
              tipo="texto"
              valor={perfil.Nome_Profissional}
              onChange={(v) => setPerfil({ ...perfil, Nome_Profissional: v })}
            />
            <FormField
              id="titulo"
              rotulo="Título/especialidade"
              tipo="texto"
              valor={perfil.Titulo}
              onChange={(v) => setPerfil({ ...perfil, Titulo: v })}
            />
            <FormField
              id="nome_clinica"
              rotulo="Nome da clínica"
              tipo="texto"
              valor={perfil.Nome_Clinica}
              onChange={(v) => setPerfil({ ...perfil, Nome_Clinica: v })}
            />
            <Button onClick={salvar}>{salvo ? "Salvo ✓" : "Salvar"}</Button>
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}
