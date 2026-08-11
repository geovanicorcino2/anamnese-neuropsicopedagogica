interface Props {
  id: string;
  rotulo: string;
  tipo: "texto" | "texto_longo" | "numero" | "data" | "hora";
  valor: string;
  onChange: (valor: string) => void;
  obrigatorio?: boolean;
}

const TIPO_HTML: Record<Props["tipo"], string> = {
  texto: "text",
  texto_longo: "text",
  numero: "number",
  data: "date",
  hora: "time",
};

export function FormField({ id, rotulo, tipo, valor, onChange, obrigatorio }: Props): React.JSX.Element {
  const rotuloClasse = obrigatorio ? "campo__rotulo campo__rotulo--obrigatorio" : "campo__rotulo";

  return (
    <div className="campo">
      <label className={rotuloClasse} htmlFor={id}>
        {rotulo}
      </label>
      {tipo === "texto_longo" ? (
        <textarea
          id={id}
          className="campo__entrada"
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          rows={4}
        />
      ) : (
        <input
          id={id}
          type={TIPO_HTML[tipo]}
          className="campo__entrada"
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
        />
      )}
    </div>
  );
}
