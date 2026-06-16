import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { VaccineBatches } from "@/pages/VaccineBatches";
import { Outbound } from "@/pages/Outbound";
import { Schedule } from "@/pages/Schedule";
import { Validation } from "@/pages/Validation";
import { Trace } from "@/pages/Trace";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vaccine-batches" element={<VaccineBatches />} />
          <Route path="outbound" element={<Outbound />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="validation" element={<Validation />} />
          <Route path="trace" element={<Trace />} />
        </Route>
      </Routes>
    </Router>
  );
}
