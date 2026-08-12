import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";

// Aparece por cima de qualquer tela enquanto Pasta_Backup não estiver configurada — reaparece a
// cada abertura do app (só é dispensado pra sessão atual), porque o risco de perder dados
// continua existindo até o usuário realmente configurar.
export function AvisoBackup(): React.JSX.Element | null {
  const [visivel, setVisivel] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const navegar = useNavigate();

  useEffect(() => {
    window.api.perfil.obter().then((perfil) => {
      if (perfil && !perfil.Pasta_Backup) setVisivel(true);
    });
  }, []);

  if (!visivel || dispensado) return null;

  return (
    <div className="aviso-backup__fundo">
      <div className="aviso-backup__caixa">
        <h2 className="aviso-backup__titulo">Configure um backup</h2>
        <p>
          Suas fichas ficam salvas só neste computador. Se ele apresentar algum problema (formatar,
          quebrar, etc.) sem um backup configurado, você pode perder tudo o que já preencheu —
          incluindo as sugestões de intervenção geradas.
        </p>
        <p>Leva menos de um minuto pra configurar, e depois disso o backup passa a ser automático.</p>
        <div className="aviso-backup__acoes">
          <Button
            onClick={() => {
              setDispensado(true);
              navegar("/backup");
            }}
          >
            Configurar backup agora
          </Button>
          <Button variante="fantasma" onClick={() => setDispensado(true)}>
            Lembrar depois
          </Button>
        </div>
      </div>
    </div>
  );
}
