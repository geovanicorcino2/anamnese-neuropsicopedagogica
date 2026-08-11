interface Props {
  id: string;
  rotulo: string;
  opcoes: string[];
  valor: string;
  onChange: (valor: string) => void;
  obrigatorio?: boolean;
}

export function Select({ id, rotulo, opcoes, valor, onChange, obrigatorio }: Props): React.JSX.Element {
  const rotuloClasse = obrigatorio ? "campo__rotulo campo__rotulo--obrigatorio" : "campo__rotulo";

  return (
    <div className="campo">
      <label className={rotuloClasse} htmlFor={id}>
        {rotulo}
      </label>
      <select id={id} className="campo__entrada" value={valor} onChange={(evento) => onChange(evento.target.value)}>
        <option value="" disabled>
          Selecione
        </option>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}
