import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Store, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === "student") {
      navigate("/student/dashboard");
    } else {
      navigate("/tenant/dashboard");
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden text-center mb-10">
             <div className="flex justify-center mb-4">
                <div className="bg-orange-50 p-4 rounded-3xl shadow-sm border border-orange-100">
                  <UtensilsCrossed className="text-orange-500 w-10 h-10" />
                </div>
             </div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">BeeFood</h1>
             <p className="text-sm text-gray-500 mt-2 font-medium">Masuk untuk mulai memesan</p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-8 hidden lg:block">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Selamat Datang 👋</h2>
              <p className="text-gray-500 font-medium">Silakan masuk ke akun Anda.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">Email Kampus</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@binus.ac.id"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 block">Masuk Sebagai</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      role === "student"
                        ? "border-orange-500 bg-orange-50 text-orange-600 shadow-md shadow-orange-500/10 scale-[1.02]"
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${role === "student" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Mahasiswa</span>
                    {role === "student" && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("tenant")}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      role === "tenant"
                        ? "border-orange-500 bg-orange-50 text-orange-600 shadow-md shadow-orange-500/10 scale-[1.02]"
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${role === "tenant" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Tenant</span>
                    {role === "tenant" && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:gap-3 group"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 transition-all group-hover:translate-x-1" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;