import type { StatusFicha } from "@core/db/types";

const CLASSE_POR_STATUS: Record<StatusFicha, string> = {
  Rascunho: "chip--rascunho",
  Concluída: "chip--concluida",
};

export function Chip({ status }: { status: StatusFicha }): React.JSX.Element {
  return <span className={`chip ${CLASSE_POR_STATUS[status]}`}>{status}</span>;
}
