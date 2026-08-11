import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function EmptyState({ titulo, descricao, acao }: Props): React.JSX.Element {
  return (
    <div className="estado-vazio">
      <p className="estado-vazio__titulo">{titulo}</p>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}
