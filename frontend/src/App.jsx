import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/Login";
import StudentDashboard from "./dashboard student/StudentDashboard";
import TenantDashboard from "./dashboard tenant/TenantDashboard";
import StudentBeePayPage from "./pages/StudentBeePayPage";
import StudentQrisCheckoutPage from "./pages/StudentQrisCheckoutPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Pertama Kali Dibuka: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Versi 1: Dashboard khusus Mahasiswa (Student) */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/beepay" element={<StudentBeePayPage />} />
        <Route path="/student/checkout/qris" element={<StudentQrisCheckoutPage />} />

        {/* Versi 2: Dashboard khusus Penjual (Tenant) */}
        <Route path="/tenant/dashboard" element={<TenantDashboard />} />

        {/* Jalur proteksi jika salah ngetik URL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;