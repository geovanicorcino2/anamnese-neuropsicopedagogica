import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "perigo" | "fantasma";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

export function Button({ variante = "primario", className, ...resto }: Props): React.JSX.Element {
  const classes = ["botao", `botao--${variante}`, className].filter(Boolean).join(" ");
  return <button className={classes} {...resto} />;
}
