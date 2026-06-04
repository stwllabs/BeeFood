import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "../config";


const StudentQrisCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, selectedTenant, totalBelanja, allGlobalMenus } = location.state || {};
  const [countdown, setCountdown] = useState(5);
  const [processing, setProcessing] = useState(false);
  const completedRef = useRef(false);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("beefood_token")}` },
  });

  useEffect(() => {
    if (!cart || !selectedTenant || !totalBelanja) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [cart, selectedTenant, totalBelanja, navigate]);

  useEffect(() => {
    if (!cart || !selectedTenant) return;

    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);

    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        submitOrder();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const submitOrder = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const itemsList = Object.keys(cart).map((id) => {
        const item = allGlobalMenus.find((m) => m.id === parseInt(id));
        return {
          menuId: item.id,
          name: item.name,
          qty: cart[id],
          price: item.price,
        };
      });

      await axios.post(
        `${API_URL}/orders`,
        {
          tenantId: selectedTenant.id,
          totalPrice: totalBelanja,
          items: itemsList,
          paymentMethod: "QRIS",
        },
        getHeaders()
      );

      navigate("/student/dashboard", {
        replace: true,
        state: { orderSuccess: true, activeTab: "orders", clearCart: true, message: "Pre-order berhasil (QRIS)!" },
      });
    } catch {
      alert("Gagal memproses pembayaran QRIS.");
      navigate("/student/dashboard");
    } finally {
      setProcessing(false);
    }
  };

  if (!cart || !selectedTenant) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/student/dashboard")}
          className="p-2 hover:bg-gray-100 rounded-xl"
          disabled={processing}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-500" /> Bayar QRIS
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <p className="text-sm text-gray-500 font-semibold mb-2">
          Scan kode QRIS di bawah ini
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Pembayaran diverifikasi otomatis — mohon tunggu
        </p>

        <div className="bg-white border-2 border-orange-100 rounded-3xl p-4 mb-5 shadow-sm">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=BEEFOOD-ORDER-Rp${totalBelanja}&color=ea580c`}
            alt="QRIS Checkout"
            className="w-52 h-52 mx-auto"
          />
        </div>

        <p className="text-2xl font-black text-orange-600 mb-1">
          Rp {totalBelanja.toLocaleString("id-ID")}
        </p>
        <p className="text-xs text-gray-400 font-bold mb-6">{selectedTenant.name}</p>

        <p className="text-sm font-bold text-gray-600">
          {countdown > 0
            ? `Memverifikasi pembayaran... ${countdown} detik`
            : processing
              ? "Menyelesaikan pesanan..."
              : "Pembayaran berhasil!"}
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
};

export default StudentQrisCheckoutPage;
