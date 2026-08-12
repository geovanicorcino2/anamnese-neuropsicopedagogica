import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./routes/Inicio";
import { Fichas } from "./routes/Fichas";
import { FichaNova } from "./routes/FichaNova";
import { FichaDetalhe } from "./routes/FichaDetalhe";
import { FichaSecao } from "./routes/FichaSecao";
import { FichaFamiliares } from "./routes/FichaFamiliares";
import { FichaHistoricoMedico } from "./routes/FichaHistoricoMedico";
import { FichaExportar } from "./routes/FichaExportar";
import { Perfil } from "./routes/Perfil";
import { Sugestoes } from "./routes/Sugestoes";
import { RelatorioFinal } from "./routes/RelatorioFinal";
import { Agenda } from "./routes/Agenda";
import { Backup } from "./routes/Backup";

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/fichas" element={<Fichas />} />
        <Route path="/fichas/nova" element={<FichaNova />} />
        <Route path="/fichas/:id" element={<FichaDetalhe />} />
        <Route path="/fichas/:id/secao/:secaoId" element={<FichaSecao />} />
        <Route path="/fichas/:id/familiares" element={<FichaFamiliares />} />
        <Route path="/fichas/:id/historico-medico" element={<FichaHistoricoMedico />} />
        <Route path="/fichas/:id/exportar" element={<FichaExportar />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/sugestoes" element={<Sugestoes />} />
        <Route path="/relatorio-final" element={<RelatorioFinal />} />
        <Route path="/agenda" element={<Agenda />} />
      </Route>
    </Routes>
  );
}
