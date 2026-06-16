import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { VaccineBatches } from "@/pages/VaccineBatches";
import { Outbound } from "@/pages/Outbound";
import { Schedule } from "@/pages/Schedule";
import { Validation } from "@/pages/Validation";
import { Trace } from "@/pages/Trace";
import { Recall } from "@/pages/Recall";
import { Statistics } from "@/pages/Statistics";

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
          <Route path="recall" element={<Recall />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}
