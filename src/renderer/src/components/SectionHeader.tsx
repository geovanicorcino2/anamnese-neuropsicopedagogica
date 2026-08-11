import type { ReactNode } from "react";

interface Props {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
}

export function SectionHeader({ titulo, subtitulo, acoes }: Props): React.JSX.Element {
  return (
    <div className="cabecalho-secao">
      <div>
        <h2 className="cabecalho-secao__titulo">{titulo}</h2>
        {subtitulo && <p className="cabecalho-secao__subtitulo">{subtitulo}</p>}
      </div>
      {acoes}
    </div>
  );
}
