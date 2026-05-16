import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student"); // Default ke mahasiswa
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-5 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-orange-500 tracking-wide">🐝 BeeFood</h1>
          <p className="text-sm text-gray-400 mt-2">Pre-Order & Pickup Kantin Kampus</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 bg-white text-sm"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Masuk Sebagai</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                  role === "student"
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                👨‍🎓 Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setRole("tenant")}
                className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                  role === "tenant"
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🏪 Tenant Kantin
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition shadow-md shadow-orange-100 active:scale-[0.98] mt-2"
          >
            Masuk ke Dasbor
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;