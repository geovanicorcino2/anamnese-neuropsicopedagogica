const OPCOES = ["Sim", "Não", "Não sei"] as const;

interface Props {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  obrigatorio?: boolean;
}

export function CampoSimNao({ rotulo, valor, onChange, obrigatorio }: Props): React.JSX.Element {
  const rotuloClasse = obrigatorio ? "campo__rotulo campo__rotulo--obrigatorio" : "campo__rotulo";

  return (
    <div className="campo">
      <span className={rotuloClasse}>{rotulo}</span>
      <div className="sim-nao">
        {OPCOES.map((opcao) => (
          <button
            key={opcao}
            type="button"
            className={`sim-nao__opcao ${valor === opcao ? "sim-nao__opcao--selecionada" : ""}`}
            onClick={() => onChange(opcao)}
          >
            {opcao}
          </button>
        ))}
      </div>
    </div>
  );
}
