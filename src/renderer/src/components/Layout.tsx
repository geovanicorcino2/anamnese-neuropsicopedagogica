import { NavLink, Outlet } from "react-router-dom";

const ITENS_NAV = [
  { rota: "/", rotulo: "Início", fim: true },
  { rota: "/fichas", rotulo: "Fichas", fim: false },
  { rota: "/perfil", rotulo: "Perfil", fim: true },
] as const;

export function Layout(): React.JSX.Element {
  return (
    <div className="layout">
      <aside className="layout__barra-lateral">
        <div className="layout__marca">
          <span className="layout__marca-titulo">Anamnese</span>
          <span className="layout__marca-subtitulo">Neuropsicopedagógica</span>
        </div>
        <nav className="layout__nav">
          {ITENS_NAV.map((item) => (
            <NavLink
              key={item.rota}
              to={item.rota}
              end={item.fim}
              className={({ isActive }) => `layout__nav-item ${isActive ? "layout__nav-item--ativo" : ""}`}
            >
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="layout__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
