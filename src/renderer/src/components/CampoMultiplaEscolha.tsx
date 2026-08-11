interface Props {
  rotulo: string;
  opcoes: string[];
  selecionadas: string[];
  onChange: (selecionadas: string[]) => void;
}

export function CampoMultiplaEscolha({ rotulo, opcoes, selecionadas, onChange }: Props): React.JSX.Element {
  function alternar(opcao: string): void {
    if (selecionadas.includes(opcao)) {
      onChange(selecionadas.filter((item) => item !== opcao));
    } else {
      onChange([...selecionadas, opcao]);
    }
  }

  return (
    <div className="campo">
      <span className="campo__rotulo">{rotulo}</span>
      <div className="multipla-escolha">
        {opcoes.map((opcao) => (
          <label key={opcao} className="multipla-escolha__item">
            <input type="checkbox" checked={selecionadas.includes(opcao)} onChange={() => alternar(opcao)} />
            {opcao}
          </label>
        ))}
      </div>
    </div>
  );
}
