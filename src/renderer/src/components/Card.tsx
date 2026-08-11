import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="cartao">{children}</div>;
}
