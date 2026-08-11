import type { CampoAnamnese } from "@core/data/anamneseSchema";
import { FormField } from "./FormField";
import { Select } from "./Select";
import { CampoSimNao } from "./CampoSimNao";
import { CampoMultiplaEscolha } from "./CampoMultiplaEscolha";

interface Props {
  campos: CampoAnamnese[];
  valores: Record<string, string>;
  onChangeValor: (idCampo: string, valor: string) => void;
}

const SEPARADOR_MULTIPLA_ESCOLHA = ";";

// tabela_familiares é renderizada à parte pela tela que usa este componente (não é uma
// resposta de RespostasFicha, e sim registros na tabela Familiares).
export function FormularioSecao({ campos, valores, onChangeValor }: Props): React.JSX.Element {
  return (
    <div className="formulario-secao__grid">
      {campos
        .filter((campo) => campo.tipo !== "tabela_familiares")
        .map((campo) => {
          const valor = valores[campo.id] ?? "";
          const classeCampo =
            campo.tipo === "texto_longo" || campo.tipo === "multipla_escolha"
              ? "formulario-secao__campo-largo"
              : undefined;

          return (
            <div key={campo.id} className={classeCampo}>
              {renderizarCampo(campo, valor, (novoValor) => onChangeValor(campo.id, novoValor))}
            </div>
          );
        })}
    </div>
  );
}

function renderizarCampo(campo: CampoAnamnese, valor: string, onChange: (valor: string) => void): React.JSX.Element {
  switch (campo.tipo) {
    case "sim_nao":
      return <CampoSimNao rotulo={campo.rotulo} valor={valor} onChange={onChange} obrigatorio={campo.obrigatorio} />;

    case "selecao":
      return (
        <Select
          id={campo.id}
          rotulo={campo.rotulo}
          opcoes={campo.opcoes ?? []}
          valor={valor}
          onChange={onChange}
          obrigatorio={campo.obrigatorio}
        />
      );

    case "multipla_escolha": {
      const selecionadas = valor ? valor.split(SEPARADOR_MULTIPLA_ESCOLHA) : [];
      return (
        <CampoMultiplaEscolha
          rotulo={campo.rotulo}
          opcoes={campo.opcoes ?? []}
          selecionadas={selecionadas}
          onChange={(novas) => onChange(novas.join(SEPARADOR_MULTIPLA_ESCOLHA))}
        />
      );
    }

    case "texto":
    case "texto_longo":
    case "numero":
    case "data":
    case "hora":
    default:
      return (
        <FormField
          id={campo.id}
          rotulo={campo.rotulo}
          tipo={campo.tipo as "texto" | "texto_longo" | "numero" | "data" | "hora"}
          valor={valor}
          onChange={onChange}
          obrigatorio={campo.obrigatorio}
        />
      );
  }
}
