import type { ReactNode } from "react";

export function ScreenContainer({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="tela">{children}</div>;
}
