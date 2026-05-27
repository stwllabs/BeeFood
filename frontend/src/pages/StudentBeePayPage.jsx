import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const StudentBeePayPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [walletHistory, setWalletHistory] = useState([]);
  const [showTopUpQris, setShowTopUpQris] = useState(false);
  const [pendingTopUpAmount, setPendingTopUpAmount] = useState(0);
  const [qrisCountdown, setQrisCountdown] = useState(5);
  const [successToast, setSuccessToast] = useState("");
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("beefood_token")}` },
  });

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const fetchWalletHistory = async () => {
    const res = await axios.get(`${API_URL}/wallet/history`, getHeaders());
    setWalletHistory(res.data || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await axios.get(`${API_URL}/profile`, getHeaders());
        setUser(profileRes.data);
        await fetchWalletHistory();
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const topUpDoneRef = useRef(false);

  useEffect(() => {
    if (!showTopUpQris) {
      topUpDoneRef.current = false;
      return;
    }
    setQrisCountdown(5);
    const interval = setInterval(() => {
      setQrisCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const timer = setTimeout(async () => {
      if (topUpDoneRef.current) return;
      topUpDoneRef.current = true;
      setTopUpLoading(true);
      try {
        await axios.post(
          `${API_URL}/wallet/topup`,
          { amount: pendingTopUpAmount, method: "QRIS" },
          getHeaders()
        );
        setTopUpAmount("");
        setPendingTopUpAmount(0);
        setShowTopUpQris(false);
        const profileRes = await axios.get(`${API_URL}/profile`, getHeaders());
        setUser(profileRes.data);
        await fetchWalletHistory();
        triggerToast("Top up BeePay berhasil!");
      } catch {
        alert("Gagal melakukan top up.");
        topUpDoneRef.current = false;
      } finally {
        setTopUpLoading(false);
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [showTopUpQris, pendingTopUpAmount]);

  const handleTopUpClick = () => {
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Masukkan nominal top up yang valid.");
      return;
    }
    setPendingTopUpAmount(amountNum);
    setShowTopUpQris(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showTopUpQris) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTopUpQris(false)}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-gray-900">Top Up via QRIS</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
          <p className="text-sm text-gray-500 font-semibold mb-6">
            Pindai QRIS — pembayaran diproses otomatis
          </p>
          <div className="bg-white border-2 border-orange-100 rounded-3xl p-4 mb-4 shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=BEEFOOD-TOPUP-Rp${pendingTopUpAmount}&color=ea580c`}
              alt="QRIS Top Up"
              className="w-52 h-52 mx-auto"
            />
          </div>
          <p className="text-2xl font-black text-orange-600 mb-2">
            Rp {pendingTopUpAmount.toLocaleString("id-ID")}
          </p>
          <p className="text-sm text-gray-500 font-bold">
            {qrisCountdown > 0
              ? `Memverifikasi pembayaran... ${qrisCountdown}s`
              : topUpLoading
                ? "Menyelesaikan..."
                : "Selesai"}
          </p>
          <div className="w-full max-w-xs h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-2xl z-50 flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" /> BeePay
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Saldo</p>
          <p className="text-lg font-black text-orange-600">
            Rp {user?.balance?.toLocaleString("id-ID")}
          </p>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-6">
        <section className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-4">Top Up BeePay</h2>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
            Nominal (Rp)
          </label>
          <input
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Contoh: 50000"
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 text-sm font-semibold mb-4"
          />
          <button
            type="button"
            onClick={handleTopUpClick}
            disabled={topUpLoading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-colors disabled:opacity-60"
          >
            Top Up via QRIS
          </button>
        </section>

        <section>
          <h2 className="text-sm font-black text-gray-900 mb-3">
            Riwayat Transaksi ({walletHistory.length})
          </h2>
          {walletHistory.length === 0 ? (
            <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center text-gray-400 text-sm">
              Belum ada riwayat transaksi.
            </div>
          ) : (
            <div className="space-y-3">
              {walletHistory.map((t) => {
                const isTopUp = t.type === "TOP_UP";
                const amountSigned = isTopUp ? t.amount : -t.amount;
                return (
                  <div
                    key={t.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-start gap-3"
                  >
                    <div>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          isTopUp
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isTopUp ? "Top Up" : "Pengeluaran"}
                      </span>
                      <p className="text-xs text-gray-500 font-bold mt-1">
                        {t.description || "-"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <span
                      className={`font-black text-sm shrink-0 ${
                        isTopUp ? "text-emerald-600" : "text-orange-600"
                      }`}
                    >
                      {amountSigned >= 0 ? "+" : "-"} Rp{" "}
                      {Math.abs(amountSigned).toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentBeePayPage;
