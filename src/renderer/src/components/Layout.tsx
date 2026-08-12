import { NavLink, Outlet } from "react-router-dom";
import { AvisoBackup } from "./AvisoBackup";

const ITENS_NAV = [
  { rota: "/", rotulo: "Início", fim: true },
  { rota: "/fichas", rotulo: "Fichas", fim: false },
  { rota: "/perfil", rotulo: "Perfil", fim: true },
  { rota: "/backup", rotulo: "Backup", fim: true },
  { rota: "/sugestoes", rotulo: "Sugestões de Intervenção", fim: true },
  { rota: "/relatorio-final", rotulo: "Relatório Final", fim: true },
  { rota: "/agenda", rotulo: "Agenda", fim: true },
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
      <AvisoBackup />
    </div>
  );
}
