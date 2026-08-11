export function ProgressBar({ percentual }: { percentual: number }): React.JSX.Element {
  const valor = Math.max(0, Math.min(100, percentual));
  return (
    <div className="barra-progresso" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
      <div className="barra-progresso__preenchida" style={{ width: `${valor}%` }} />
    </div>
  );
}
