import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./routes/Inicio";
import { Fichas } from "./routes/Fichas";
import { FichaNova } from "./routes/FichaNova";
import { FichaDetalhe } from "./routes/FichaDetalhe";
import { FichaSecao } from "./routes/FichaSecao";
import { FichaFamiliares } from "./routes/FichaFamiliares";
import { FichaExportar } from "./routes/FichaExportar";
import { Perfil } from "./routes/Perfil";

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
        <Route path="/fichas/:id/exportar" element={<FichaExportar />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
    </Routes>
  );
}
