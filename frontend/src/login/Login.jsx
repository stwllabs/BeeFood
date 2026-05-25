import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Store, ArrowRight, Mail, Lock, User as UserIcon, Phone, FileText, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const Login = () => {
  const navigate = useNavigate();
  
  // Tab State: "login" atau "register"
  const [activeTab, setActiveTab] = useState("login");
  const [role, setRole] = useState("student"); // "student" atau "tenant"
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Student Specific
  const [nim, setNim] = useState("");
  
  // Tenant Specific
  const [tenantName, setTenantName] = useState("");
  const [tenantLocation, setTenantLocation] = useState("");
  
  // UI States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear messages on tab/role switch
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, [activeTab, role]);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("beefood_token");
    const userStr = localStorage.getItem("beefood_user");
    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "STUDENT") {
        navigate("/student/dashboard");
      } else if (user.role === "TENANT") {
        navigate("/tenant/dashboard");
      }
    }
  }, [navigate]);

  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // General Validation
    if (!validateEmail(email)) {
      setErrorMsg("Format email tidak valid. Pastikan menggunakan @ dan domain.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      if (activeTab === "login") {
        // --- LOGIN FLOW ---
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        
        setSuccessMsg("Berhasil masuk! Mengalihkan ke dasbor...");
        
        localStorage.setItem("beefood_token", response.data.token);
        localStorage.setItem("beefood_user", JSON.stringify(response.data.user));
        
        setTimeout(() => {
          if (response.data.user.role === "STUDENT") {
            navigate("/student/dashboard");
          } else {
            navigate("/tenant/dashboard");
          }
        }, 1500);

      } else {
        // --- REGISTER FLOW ---
        const registerPayload = {
          name,
          email,
          password,
          role: role.toUpperCase(),
          phoneNumber,
          nim: role === "student" ? nim : undefined,
          tenantName: role === "tenant" ? tenantName : undefined,
          tenantLocation: role === "tenant" ? tenantLocation : undefined
        };

        // Specific Validation
        if (role === "student" && !nim) {
          setErrorMsg("NIM wajib diisi untuk Mahasiswa.");
          setLoading(false);
          return;
        }

        if (role === "tenant") {
          if (!tenantName || !tenantLocation) {
            setErrorMsg("Nama tenant dan lokasi kantin wajib diisi.");
            setLoading(false);
            return;
          }
        }

        const response = await axios.post(`${API_URL}/auth/register`, registerPayload);
        
        setSuccessMsg("Registrasi berhasil! Silakan masuk dengan akun baru Anda.");
        setActiveTab("login");
        setPassword("");
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Terjadi kesalahan koneksi ke server. Pastikan backend aktif.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Left Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-orange-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 opacity-90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80" 
          alt="Delicious food" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative z-20 flex flex-col justify-center items-start p-16 text-white h-full w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <UtensilsCrossed className="text-orange-500 w-8 h-8" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">BeeFood</h1>
            </div>
            <h2 className="text-5xl font-black mb-6 leading-tight">Pre-Order Cepat.<br/>Bebas Antre.</h2>
            <p className="text-lg text-orange-100 max-w-md font-medium leading-relaxed">
              Platform revolusioner untuk mahasiswa dan tenant kantin. Pesan makananmu dari kelas, ambil saat sudah siap!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md my-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
             <div className="flex justify-center mb-2">
                <div className="bg-orange-50 p-3 rounded-3xl border border-orange-100 shadow-sm">
                  <UtensilsCrossed className="text-orange-500 w-8 h-8" />
                </div>
             </div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">BeeFood</h1>
          </div>

          <div className="mb-6">
            {/* Tab Toggle Login / Register */}
            <div className="grid grid-cols-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`py-3 text-sm font-bold rounded-xl transition-all ${
                  activeTab === "login"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`py-3 text-sm font-bold rounded-xl transition-all ${
                  activeTab === "register"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Daftar Akun
              </button>
            </div>
          </div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                {activeTab === "login" ? "Selamat Datang 👋" : "Buat Akun Baru ✨"}
              </h2>
              <p className="text-gray-500 text-sm font-medium mt-1">
                {activeTab === "login" 
                  ? "Silakan masuk untuk mulai memesan makanan." 
                  : "Daftar sebagai mahasiswa atau tenant kantin."}
              </p>
            </div>

            {/* Error & Success Messages */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-start gap-3 mb-6 text-sm font-medium"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl flex items-start gap-3 mb-6 text-sm font-medium"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-5">
              
              {/* REGISTER ONLY FIELDS */}
              {activeTab === "register" && (
                <>
                  {/* Role Selection for Register */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Daftar Sebagai</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                          role === "student"
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Mahasiswa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("tenant")}
                        className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                          role === "tenant"
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Tenant</span>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Lengkap Anda"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nomor Telepon</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Student NIM */}
                  {role === "student" && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">NIM (Nomor Induk Mahasiswa)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={nim}
                          onChange={(e) => setNim(e.target.value)}
                          placeholder="Contoh: 2501987654"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Tenant Details */}
                  {role === "tenant" && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Tenant/Toko</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Store className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={tenantName}
                            onChange={(e) => setTenantName(e.target.value)}
                            placeholder="Contoh: Kantin Ayam Geprek SASC"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Lokasi Kantin</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={tenantLocation}
                            onChange={(e) => setTenantLocation(e.target.value)}
                            placeholder="Contoh: Kantin SASC Lt. 1"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* COMMON FIELDS: EMAIL & PASSWORD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === "login" ? "nama@binus.ac.id" : "Masukkan email Anda"}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group hover:gap-3 ${
                  loading ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5"
                }`}
              >
                <span>{loading ? "Memproses..." : activeTab === "login" ? "Masuk Sekarang" : "Buat Akun Sekarang"}</span>
                {!loading && <ArrowRight className="w-4 h-4 transition-all group-hover:translate-x-1" />}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;