import { NavLink } from "react-router-dom";

export interface ItemAba {
  segmento: string;
  rotulo: string;
}

interface TabsProps {
  base: string;
  itens: ItemAba[];
}

// Barra de abas simples (NavLink) — mesmo padrão de destaque do item ativo já usado no menu
// lateral (Layout.tsx). Não existia nenhum componente de abas no app antes do hub de Pacientes.
export function Tabs({ base, itens }: TabsProps): React.JSX.Element {
  return (
    <nav className="abas">
      {itens.map((item) => (
        <NavLink
          key={item.segmento}
          to={`${base}/${item.segmento}`}
          className={({ isActive }) => `abas__item ${isActive ? "abas__item--ativo" : ""}`}
        >
          {item.rotulo}
        </NavLink>
      ))}
    </nav>
  );
}
