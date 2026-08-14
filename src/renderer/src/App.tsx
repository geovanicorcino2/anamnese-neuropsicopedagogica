import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./routes/Inicio";
import { Pacientes } from "./routes/Pacientes";
import { PacienteNovo } from "./routes/PacienteNovo";
import { PacienteDetalhe } from "./routes/PacienteDetalhe";
import { PacienteAnamnese } from "./routes/PacienteAnamnese";
import { PacientePlanejamento } from "./routes/PacientePlanejamento";
import { PacientePlanoTerapeutico } from "./routes/PacientePlanoTerapeutico";
import { PacienteRelatorioAvaliativo } from "./routes/PacienteRelatorioAvaliativo";
import { FichaHistoricoMedico } from "./routes/FichaHistoricoMedico";
import { FichaSecao } from "./routes/FichaSecao";
import { FichaFamiliares } from "./routes/FichaFamiliares";
import { FichaExportar } from "./routes/FichaExportar";
import { Perfil } from "./routes/Perfil";
import { Agenda } from "./routes/Agenda";
import { Backup } from "./routes/Backup";

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/pacientes/novo" element={<PacienteNovo />} />
        <Route path="/pacientes/:id" element={<PacienteDetalhe />}>
          <Route index element={<Navigate to="anamnese" replace />} />
          <Route path="anamnese" element={<PacienteAnamnese />} />
          <Route path="planejamento" element={<PacientePlanejamento />} />
          <Route path="plano-terapeutico" element={<PacientePlanoTerapeutico />} />
          <Route path="relatorio-avaliativo" element={<PacienteRelatorioAvaliativo />} />
          <Route path="historico-medico" element={<FichaHistoricoMedico />} />
        </Route>
        <Route path="/pacientes/:id/secao/:secaoId" element={<FichaSecao />} />
        <Route path="/pacientes/:id/familiares" element={<FichaFamiliares />} />
        <Route path="/pacientes/:id/exportar" element={<FichaExportar />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/agenda" element={<Agenda />} />
      </Route>
    </Routes>
  );
}
