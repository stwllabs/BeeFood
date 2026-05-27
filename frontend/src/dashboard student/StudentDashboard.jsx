import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Wallet, ChevronLeft, MapPin, Star, ShoppingBag, X, ChefHat, Clock, User, Phone, FileText, CheckCircle2, History, MessageSquare, LogOut, Upload, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const getOrderStatusLabel = (status) => {
  if (status === "PENDING") return "Menunggu";
  if (status === "COOKING") return "Dimasak";
  return "Siap diambil";
};

const getOrderStatusClass = (status) => {
  if (status === "PENDING") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "COOKING") return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-green-50 text-green-700 border-green-100";
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State Utama
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  // Navigation & UI Tabs: "home" atau "orders"
  const [activeTab, setActiveTab] = useState("home");
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("BEEPAY"); // BEEPAY | QRIS
  
  // Profile Form State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileNim, setProfileNim] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  
  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  
  // Status UI
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const categories = ["Semua", "Makanan Berat", "Minuman / Coffee", "Camilan", "Sehat"];
  
  // Preset Avatars
  const presetAvatars = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Evan",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Lulu",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi"
  ];

  // Get auth headers
  const getHeaders = () => {
    const token = localStorage.getItem("beefood_token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await axios.get(`${API_URL}/profile`, getHeaders());
      setUser(profileRes.data);
      
      // Initialize profile form
      setProfileName(profileRes.data.name);
      setProfilePhone(profileRes.data.phoneNumber || "");
      setProfileNim(profileRes.data.nim || "");
      setProfileAvatar(profileRes.data.avatar || presetAvatars[0]);

      const tenantsRes = await axios.get(`${API_URL}/tenants`);
      setTenants(tenantsRes.data);

      const ordersRes = await axios.get(`${API_URL}/orders/user`, getHeaders());
      setOrders(ordersRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memuat data dari server. Silakan masuk kembali.");
      // If unauthorized, redirect to login
      localStorage.removeItem("beefood_token");
      localStorage.removeItem("beefood_user");
      navigate("/");
    }
  };

  useEffect(() => {
    fetchData();
    // Poll orders status every 3 seconds to keep status in sync
    const interval = setInterval(async () => {
      try {
        const ordersRes = await axios.get(`${API_URL}/orders/user`, getHeaders());
        setOrders(ordersRes.data);
      } catch (e) {
        console.error("Poller error:", e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  useEffect(() => {
    if (location.state?.orderSuccess) {
      setActiveTab(location.state.activeTab || "orders");
      if (location.state.clearCart) {
        setCart({});
        setShowMobileCart(false);
      }
      triggerToast(location.state.message || "Pre-order berhasil!");
      navigate("/student/dashboard", { replace: true, state: {} });
      axios.get(`${API_URL}/orders/user`, getHeaders()).then((res) => setOrders(res.data));
      axios.get(`${API_URL}/profile`, getHeaders()).then((res) => setUser(res.data));
    }
  }, [location.state]);

  const goToBeePay = () => navigate("/student/beepay");

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await axios.put(`${API_URL}/profile`, {
        name: profileName,
        phoneNumber: profilePhone,
        nim: profileNim,
        avatar: profileAvatar
      }, getHeaders());
      
      setUser(response.data.user);
      localStorage.setItem("beefood_user", JSON.stringify(response.data.user));
      setShowProfileModal(false);
      triggerToast("🎉 Profil berhasil diperbarui!");
    } catch (err) {
      alert("Gagal memperbarui profil.");
    } finally {
      setActionLoading(false);
    }
  };

  // Cart Management
  const allGlobalMenus = tenants.flatMap(t => t.menus);

  const updateCartQuantity = (id, change) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = currentQty + change;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const totalBelanja = Object.keys(cart).reduce((sum, id) => {
    const item = allGlobalMenus.find((m) => m.id === parseInt(id));
    return sum + (item ? item.price * cart[id] : 0);
  }, 0);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const queryLower = searchQuery.trim().toLowerCase();

  // Search hanya berdasarkan nama menu (bukan nama tenant)
  const filteredTenants = tenants.filter(t => {
    const matchesMenuName = !queryLower || t.menus.some(m => m.name.toLowerCase().includes(queryLower));
    const matchesCategory = selectedCategory === "Semua" || t.category === selectedCategory || t.name === "Kantin Ayam Geprek SASC" && selectedCategory === "Makanan Berat" || t.name === "Kedai Kopi Kampus & Boba" && selectedCategory === "Minuman / Coffee" || t.name === "Gorengan Renyah Kampus" && selectedCategory === "Camilan";
    return matchesMenuName && matchesCategory;
  });

  const matchingMenus = queryLower
    ? filteredTenants.flatMap((t) =>
        t.menus
          .filter((m) => m.name.toLowerCase().includes(queryLower))
          .map((m) => ({ ...m, tenantId: t.id, tenantName: t.name }))
      )
    : [];

  // If user adds from search results, force cart to 1 tenant only.
  // When tenant changes, clear cart and switch selectedTenant.
  const handleSearchMenuQtyChange = (menu, change) => {
    const isSameTenant = selectedTenant && selectedTenant.id === menu.tenantId;

    if (!isSameTenant) {
      if (change <= 0) return;
      const nextTenant = tenants.find((t) => t.id === menu.tenantId);
      if (nextTenant) setSelectedTenant(nextTenant);
      setCart({ [menu.id]: 1 });
      return;
    }

    setCart((prev) => {
      const currentQty = prev[menu.id] || 0;
      const newQty = currentQty + change;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[menu.id];
        return copy;
      }
      return { ...prev, [menu.id]: newQty };
    });
  };

  // Handle Checkout / Payment
  const handleCheckout = async () => {
    if (totalBelanja === 0 || !user) return;
    if (!selectedTenant) {
      alert("Pilih tenant terlebih dahulu.");
      return;
    }

    if (paymentMethod === "BEEPAY" && user.balance < totalBelanja) {
      goToBeePay();
      return;
    }

    if (paymentMethod === "QRIS") {
      navigate("/student/checkout/qris", {
        state: { cart, selectedTenant, totalBelanja, allGlobalMenus },
      });
      return;
    }

    setActionLoading(true);
    try {
      const itemsList = Object.keys(cart).map(id => {
        const item = allGlobalMenus.find(m => m.id === parseInt(id));
        return {
          menuId: item.id,
          name: item.name,
          qty: cart[id],
          price: item.price
        };
      });

      const orderPayload = {
        tenantId: selectedTenant.id,
        totalPrice: totalBelanja,
        items: itemsList,
        paymentMethod
      };

      await axios.post(`${API_URL}/orders`, orderPayload, getHeaders());

      // Refresh balance dari backend agar konsisten (karena debit hanya untuk BEEPAY)
      const profileRes = await axios.get(`${API_URL}/profile`, getHeaders());
      setUser(profileRes.data);

      setCart({});
      setShowMobileCart(false);
      
      // Refetch orders list & go to orders tab
      const ordersRes = await axios.get(`${API_URL}/orders/user`, getHeaders());
      setOrders(ordersRes.data);
      setActiveTab("orders");
      
      triggerToast("🎉 Pre-order berhasil!");
    } catch (err) {
      alert("Gagal memproses checkout.");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Pick Up (DONE)
  const handleConfirmPickup = async (orderId) => {
    try {
      setActionLoading(true);
      await axios.patch(`${API_URL}/orders/${orderId}`, { status: "DONE" }, getHeaders());
      
      // Refetch orders
      const ordersRes = await axios.get(`${API_URL}/orders/user`, getHeaders());
      setOrders(ordersRes.data);
      
      triggerToast("🍽️ Pesanan selesai diambil! Selamat menikmati.");
    } catch (err) {
      alert("Gagal menyelesaikan pick up.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Feedback Review
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedOrderForFeedback) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/orders/${selectedOrderForFeedback.id}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment
      }, getHeaders());

      // Refetch orders & tenants to recalculate dynamic ratings
      const ordersRes = await axios.get(`${API_URL}/orders/user`, getHeaders());
      setOrders(ordersRes.data);
      const tenantsRes = await axios.get(`${API_URL}/tenants`);
      setTenants(tenantsRes.data);
      
      setShowFeedbackModal(false);
      setFeedbackComment("");
      setFeedbackRating(5);
      setSelectedOrderForFeedback(null);
      triggerToast("⭐ Terima kasih atas ulasan Anda!");
    } catch (err) {
      alert("Gagal mengirim ulasan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("beefood_token");
    localStorage.removeItem("beefood_user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-gray-500 text-sm">Memuat halaman BeeFood...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== "DONE");
  const pastOrders = orders.filter(o => o.status === "DONE");

  const renderCartContent = () => (
    <>
      <h3 className="font-black text-gray-800 text-lg border-b border-gray-100 pb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-orange-500" /> Keranjang Belanja
      </h3>
      
      {Object.keys(cart).length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
             <ShoppingBag className="w-10 h-10 text-orange-200" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Keranjang masih kosong.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[40vh] md:max-h-[50vh] overflow-y-auto pr-2 mt-4 custom-scrollbar">
          {Object.keys(cart).map((id) => {
            const matchedMenu = allGlobalMenus.find((m) => m.id === parseInt(id));
            if (!matchedMenu) return null;
            return (
              <div key={id} className="flex justify-between items-start text-sm border-b border-gray-50 pb-4">
                <div className="max-w-[65%]">
                  <p className="font-bold text-gray-800 leading-tight">{matchedMenu.name}</p>
                  <p className="text-gray-400 text-xs mt-1">Rp {matchedMenu.price.toLocaleString("id-ID")} x {cart[id]}</p>
                </div>
                <span className="font-black text-gray-800">Rp {(matchedMenu.price * cart[id]).toLocaleString("id-ID")}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Method */}
      <div className="pt-4 border-t border-gray-100 mt-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Metode Pembayaran</span>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("QRIS")}
            className={`py-2.5 rounded-2xl text-xs font-black border transition-colors cursor-pointer ${
              paymentMethod === "QRIS"
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-orange-200"
            }`}
          >
            QRIS
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("BEEPAY")}
            className={`py-2.5 rounded-2xl text-xs font-black border transition-colors cursor-pointer ${
              paymentMethod === "BEEPAY"
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-orange-200"
            }`}
          >
            BeePay
          </button>
        </div>

        {paymentMethod === "BEEPAY" && user?.balance < totalBelanja && (
          <div className="mt-3 p-3 rounded-2xl bg-orange-50 border border-orange-100">
            <p className="text-xs font-bold text-orange-700">
              Saldo BeePay kamu kurang. Top up dulu ya.
            </p>
            <button
              type="button"
              onClick={goToBeePay}
              className="mt-2 w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-colors cursor-pointer"
            >
              Top Up BeePay
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto">
        <div className="flex justify-between text-base mb-4">
          <span className="text-gray-500 font-bold">Total Bayar:</span>
          <span className="font-black text-xl text-orange-600">Rp {totalBelanja.toLocaleString("id-ID")}</span>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={totalBelanja === 0 || actionLoading}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            totalBelanja > 0 && !actionLoading
              ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transform hover:-translate-y-0.5 cursor-pointer" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Wallet className="w-4 h-4" />{" "}
          {actionLoading
            ? "Memproses..."
            : paymentMethod === "QRIS"
              ? "Bayar dengan QRIS"
              : "Bayar Sekarang"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-24 md:pb-10 relative">
      
      {/* SUCCESS TOAST NOTIFICATION */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-0 left-1/2 bg-gray-900 text-white border border-gray-800 px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-semibold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER UTAMA */}
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-40">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => { setSelectedTenant(null); setActiveTab("home"); }}>
          <div className="bg-orange-500 text-white p-2 rounded-xl shadow-sm shadow-orange-500/20">
             <ChefHat className="w-6 h-6" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Bee<span className="text-orange-500">Food</span></h1>
            <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit">Tanpa Antre</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Menu Navigation Buttons */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab("home"); setSelectedTenant(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "home" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "orders" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Pesanan Saya ({activeOrders.length})
            </button>
          </div>

          {/* Saldo BeePay */}
          <button
            onClick={goToBeePay}
            className="bg-orange-50 hover:bg-orange-100/80 px-4 py-2 rounded-2xl border border-orange-100 flex items-center gap-3 cursor-pointer transition-colors text-left outline-none"
          >
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
               <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">BeePay</p>
              <p className="text-sm font-black text-orange-600 leading-none mt-0.5">Rp {user?.balance.toLocaleString("id-ID")}</p>
            </div>
          </button>

          {/* User Profile Trigger */}
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl border border-gray-100 transition-colors shrink-0"
          >
            <img 
              src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=default"} 
              alt={user?.name} 
              className="w-8 h-8 rounded-full border border-gray-200 bg-orange-50"
            />
            <span className="text-xs font-bold text-gray-700 hidden sm:inline-block max-w-[100px] truncate">{user?.name}</span>
          </button>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            title="Keluar"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around md:hidden z-40 shadow-xl">
        <button 
          onClick={() => { setActiveTab("home"); setSelectedTenant(null); }}
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
            activeTab === "home" ? "text-orange-500" : "text-gray-400"
          }`}
        >
          <ChefHat className="w-5 h-5" />
          <span>Beranda</span>
        </button>
        <button 
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 text-xs font-bold relative transition-all ${
            activeTab === "orders" ? "text-orange-500" : "text-gray-400"
          }`}
        >
          <History className="w-5 h-5" />
          <span>Pesanan</span>
          {activeOrders.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black">
              {activeOrders.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setShowProfileModal(true)}
          className="flex flex-col items-center gap-1 text-xs font-bold text-gray-400"
        >
          <User className="w-5 h-5" />
          <span>Profil</span>
        </button>
      </nav>

      {/* KONTEN UTAMA */}
      <main className="p-6 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* KOLOM UTAMA */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: HOME PAGE */}
          {activeTab === "home" && (
            <>
              {!selectedTenant ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {/* PROMO HERO BANNER */}
                  <div className="relative rounded-3xl overflow-hidden shadow-sm border border-orange-100 bg-white mt-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/30 to-amber-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    
                    <div className="absolute right-0 top-0 bottom-0 pointer-events-none w-[55%] h-full hidden sm:block">
                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 w-1/3" />
                      <img 
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80" 
                        alt="Healthy Food" 
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <div className="relative z-10 p-8 md:p-12 flex justify-between items-center">
                      <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 bg-orange-100/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-200 shadow-sm mb-5">
                          <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Pre-Order Cepat</span>
                        </div>
                        
                        <p className="text-orange-600 font-black text-sm md:text-base mb-2">
                          Selamat datang, {user?.name?.split(" ")[0] || "Mahasiswa"}! 👋
                        </p>
                        <h2 className="text-3xl md:text-5xl font-black mb-4 leading-[1.1] tracking-tight text-gray-900">
                          Pesan Sekarang,<br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Ambil Nanti!</span>
                        </h2>
                        
                        <p className="text-gray-600 text-sm md:text-base font-medium mb-8 max-w-sm leading-relaxed">
                          Estimasi pengerjaan terpantau real-time. Hindari antrean panjang dan nikmati waktu istirahatmu.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SEARCH & FILTER */}
                  <div className="space-y-4 sticky top-20 z-30 bg-gray-50/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama menu (Ayam Geprek, Latte, Boba, Mendoan)..." 
                        className="w-full bg-white py-4 pl-12 pr-4 rounded-2xl border border-gray-200 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-sm shadow-sm"
                      />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-2 cursor-pointer ${
                            selectedCategory === cat 
                              ? "bg-gray-900 text-white border-gray-900 shadow-md" 
                              : "bg-white text-gray-500 border-transparent hover:border-gray-200 shadow-sm"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DAFTAR MENU HASIL SEARCH / TENANT */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black text-gray-900">
                        {searchQuery ? "Hasil Pencarian Menu" : "Pilihan Restoran Kantin"}
                      </h2>
                      {searchQuery ? (
                        <span className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                          Ditemukan {matchingMenus.length} Menu yang Cocok
                        </span>
                      ) : null}
                    </div>

                    {searchQuery ? (
                      matchingMenus.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm max-w-md mx-auto">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <h4 className="font-bold text-gray-700 text-base">Tidak Ada Menu Cocok</h4>
                          <p className="text-gray-400 text-sm mt-1">Coba kata kunci lain, misalnya: “Ayam”, “Latte”, atau “Boba”.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                          {matchingMenus.map((menu) => {
                            const qty = cart[menu.id] || 0;
                            return (
                              <motion.div
                                key={menu.id}
                                whileHover={{ y: -2 }}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4 relative"
                              >
                                {/* Foto (Kiri) */}
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl relative overflow-hidden bg-gray-100 shrink-0">
                                  <img
                                    src={menu.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"}
                                    alt={menu.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Detail Info (Tengah/Kanan) */}
                                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-1 pr-24">
                                  <div>
                                    <h4 className="font-black text-gray-900 text-base md:text-lg leading-tight truncate">{menu.name}</h4>
                                    <p className="text-[10px] text-orange-500 font-bold bg-orange-50 border border-orange-100/50 px-2 py-0.5 rounded-md inline-block mt-1">
                                      {menu.tenantName}
                                    </p>
                                    <p className="text-xs text-gray-400 font-bold mt-2 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-orange-500" /> Estimasi Masak: {menu.estimatedTime} menit
                                    </p>
                                  </div>

                                  {/* Buttons Tambah / Qty */}
                                  <div className="mt-3 w-32">
                                    {!menu.isAvailable ? (
                                      <div className="bg-red-500 text-white text-[10px] font-black py-1.5 rounded-xl text-center shadow-md">
                                        Habis
                                      </div>
                                    ) : qty === 0 ? (
                                      <button
                                        onClick={() => handleSearchMenuQtyChange(menu, 1)}
                                        className="w-full bg-white text-gray-900 hover:text-orange-600 border border-gray-100 text-xs font-black py-1.5 rounded-xl shadow-md transition-colors text-center cursor-pointer"
                                      >
                                        Tambah
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-between bg-orange-500 text-white text-xs font-black py-1 px-1.5 rounded-xl shadow-md">
                                        <button
                                          onClick={() => handleSearchMenuQtyChange(menu, -1)}
                                          className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-lg cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <span>{qty}</span>
                                        <button
                                          onClick={() => handleSearchMenuQtyChange(menu, 1)}
                                          className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-lg cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Pojok Kanan Atas Harga */}
                                <div className="absolute top-4 right-4 text-right">
                                  <p className="text-orange-600 font-black text-base md:text-lg">
                                    Rp {menu.price.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )
                    ) : filteredTenants.length === 0 ? (
                      <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm max-w-md mx-auto">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="font-bold text-gray-700 text-base">Tidak Ada Hasil Cocok</h4>
                        <p className="text-gray-400 text-sm mt-1">Gunakan kata kunci pencarian menu lainnya.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredTenants.map((tenant) => (
                          <motion.div 
                            whileHover={{ y: -4 }}
                            key={tenant.id}
                            onClick={() => setSelectedTenant(tenant)}
                            className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer transition-all flex flex-col group"
                          >
                            <div className="h-40 w-full relative overflow-hidden bg-gray-100">
                              <img src={tenant.image} alt={tenant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                              <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                                Kantin Binus
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                   <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-orange-600 transition-colors">{tenant.name}</h3>
                                   <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shrink-0">
                                     <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                     <span className="text-xs font-bold text-gray-700">{tenant.rating}</span>
                                   </div>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-3">{tenant.location}</p>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-400 font-semibold border-t border-gray-50 pt-3 mt-1">
                                 <span>{tenant.menus.length} Menu Hidangan</span>
                                 <span className="text-orange-500 flex items-center gap-1">Lihat Menu <ChevronLeft className="w-3.5 h-3.5 rotate-180" /></span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                </motion.div>
              ) : (
                
                // TAB 1: DETAIL MENU TENANT
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => setSelectedTenant(null)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm transition-all hover:border-orange-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
                  </button>

                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50" />
                    <img src={selectedTenant.image} alt={selectedTenant.name} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl shadow-md z-10" />
                    <div className="space-y-2 z-10">
                      <span className="inline-block bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        TENANT AKTIF
                      </span>
                      <h2 className="text-3xl font-black text-gray-900">{selectedTenant.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-500" /> {selectedTenant.location}</span>
                        <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {selectedTenant.rating} ({selectedTenant.reviewCount || 0} Ulasan)</span>
                      </div>
                    </div>
                  </div>

                  {/* List Menu Hidangan */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-gray-900">Pilihan Menu Hidangan</h3>
                      {searchQuery && (
                        <span className="text-xs font-bold text-gray-400">Menyaring pencarian: "{searchQuery}"</span>
                      )}
                    </div>

                    <div className="grid gap-4">
                      {selectedTenant.menus
                        .filter(menu => menu.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((menu) => (
                          <div key={menu.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between gap-4">
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <h4 className="font-black text-gray-900 text-base">{menu.name}</h4>
                                <p className="text-xs text-gray-400 font-bold mt-1.5 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Estimasi Masak: {menu.estimatedTime} menit
                                </p>
                              </div>
                              <p className="text-orange-600 font-black text-lg mt-3">Rp {menu.price.toLocaleString("id-ID")}</p>
                            </div>
                            
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl relative overflow-hidden shrink-0 group">
                              <img src={menu.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80" />
                              
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[85%]">
                                {!menu.isAvailable ? (
                                  <div className="w-full bg-red-500 text-white text-[10px] font-black py-2 rounded-xl text-center shadow-lg">
                                    Habis
                                  </div>
                                ) : !cart[menu.id] ? (
                                  <button 
                                    onClick={() => updateCartQuantity(menu.id, 1)}
                                    className="w-full bg-white text-gray-900 hover:text-orange-600 border border-gray-100 text-xs font-black py-2 rounded-xl shadow-lg transition-colors text-center cursor-pointer"
                                  >
                                    Tambah
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-between bg-orange-500 text-white text-sm font-black py-1.5 px-1 rounded-xl shadow-lg">
                                    <button onClick={() => updateCartQuantity(menu.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg cursor-pointer">-</button>
                                    <span>{cart[menu.id]}</span>
                                    <button onClick={() => updateCartQuantity(menu.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg cursor-pointer">+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                      ))}

                      {selectedTenant.menus.filter(menu => menu.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="p-8 text-center bg-white border border-gray-100 rounded-3xl text-gray-400">
                          Tidak ada menu yang cocok dengan kata kunci pencarian Anda.
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}
            </>
          )}

          {/* TAB 2: ACTIVE & HISTORY ORDERS PAGE */}
          {activeTab === "orders" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* SECTION 1: ANTRIAN PRE-ORDER AKTIF */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-500" /> Antrean Pre-Order Aktif
                </h3>
                
                {activeOrders.length === 0 ? (
                  <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm text-gray-400 max-w-md mx-auto">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2 animate-pulse" />
                    <p className="font-semibold text-sm">Tidak ada pre-order yang sedang aktif.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((o) => {
                      const itemsDetail = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                      return (
                        <motion.div 
                          layoutId={`order-card-${o.id}`}
                          key={o.id}
                          className={`p-6 rounded-3xl border shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden transition-all bg-white ${
                            o.status === "READY" ? "border-green-200 bg-green-50/20" : "border-orange-100"
                          }`}
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full ${
                            o.status === "PENDING" ? "bg-blue-400" :
                            o.status === "COOKING" ? "bg-orange-500" : "bg-green-500"
                          }`} />

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getOrderStatusClass(o.status)}`}>
                                {getOrderStatusLabel(o.status)}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-gray-400">BEE-{o.id}</span>
                            </div>
                            
                            {/* Detail Menu List */}
                            <div className="space-y-1 mt-1">
                              {itemsDetail.map((it, idx) => (
                                <p key={idx} className="font-black text-gray-900 text-sm">
                                  {it.name} <span className="text-orange-500">x{it.qty}</span>
                                </p>
                              ))}
                            </div>

                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {o.tenant?.name || "Kantin"} • Total: <span className="text-orange-500 font-bold">Rp {o.totalPrice.toLocaleString("id-ID")}</span>
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 w-full md:w-auto text-center shrink-0">
                            {o.status === "READY" ? (
                              <button 
                                onClick={() => handleConfirmPickup(o.id)}
                                disabled={actionLoading}
                                className="bg-green-500 hover:bg-green-600 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                              >
                                {actionLoading ? "Memproses..." : "Selesai Pick Up"}
                              </button>
                            ) : (
                              <div className="bg-orange-50/50 border border-orange-100 rounded-xl px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-orange-700">
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                                <span>Sedang Diproses...</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: RIWAYAT PRE-ORDER LALU */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-500" /> Riwayat Transaksi Selesai
                </h3>

                {pastOrders.length === 0 ? (
                  <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm text-gray-400 max-w-md mx-auto">
                    <p className="font-semibold text-sm">Belum ada riwayat pesanan.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastOrders.map((o) => {
                      const itemsDetail = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                      return (
                        <div key={o.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-black bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md uppercase">
                                SELESAI PICK UP
                              </span>
                              <span className="text-[10px] font-mono font-bold text-gray-400">Order ID: BEE-{o.id}</span>
                            </div>
                            
                            {/* Detail List */}
                            <div className="space-y-1">
                              {itemsDetail.map((it, idx) => (
                                <p key={idx} className="font-bold text-gray-800 text-sm">
                                  {it.name} <span className="text-gray-400">x{it.qty}</span>
                                </p>
                              ))}
                            </div>

                            <p className="text-xs text-gray-400 font-semibold mt-2.5">
                              Tenant: {o.tenant?.name || "Kantin"} • Rp {o.totalPrice.toLocaleString("id-ID")}
                            </p>
                          </div>

                          <div className="shrink-0 w-full md:w-auto">
                            {o.feedback ? (
                              <div className="flex items-center gap-1 bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-100">
                                <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                  Rating Anda: {o.feedback.rating} <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedOrderForFeedback(o);
                                  setShowFeedbackModal(true);
                                }}
                                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <MessageSquare className="w-4 h-4" /> Beri Ulasan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </div>

        {/* KASIR / SHOPPING BASKET DESKTOP */}
        <div className="hidden lg:block">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-24 flex flex-col">
             {renderCartContent()}
          </div>
        </div>

      </main>

      {/* FLOATING MOBILE CART BUTTON */}
      <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40">
        <AnimatePresence>
          {totalItems > 0 && !showMobileCart && activeTab === "home" && (
            <motion.button 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={() => setShowMobileCart(true)}
              className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-black border border-gray-800 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {totalItems}
                </div>
                <span>Lihat Keranjang</span>
              </div>
              <span className="text-orange-400">Rp {totalBelanja.toLocaleString("id-ID")}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE CART MODAL */}
      <AnimatePresence>
        {showMobileCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileCart(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 lg:hidden flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setShowMobileCart(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
              {renderCartContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROFILE SETTINGS MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-5 right-5 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" /> Profil Mahasiswa
                </h3>

                {/* Preset Avatars Selection */}
                <div className="mb-6 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Pilih Avatar Profil</label>
                  <div className="flex justify-between items-center gap-2 overflow-x-auto p-1 border border-gray-100 rounded-2xl bg-gray-50">
                    {presetAvatars.map((avUrl) => (
                      <button
                        key={avUrl}
                        type="button"
                        onClick={() => setProfileAvatar(avUrl)}
                        className={`w-12 h-12 rounded-full border-2 transition-all p-0.5 bg-white shrink-0 cursor-pointer ${
                          profileAvatar === avUrl ? "border-orange-500 scale-110 shadow-md shadow-orange-500/10" : "border-transparent"
                        }`}
                      >
                        <img src={avUrl} alt="Avatar Selection" className="w-full h-full rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-4.5 w-4.5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nomor Telepon</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-4.5 w-4.5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* NIM */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">NIM (Nomor Induk Mahasiswa)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FileText className="h-4.5 w-4.5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profileNim}
                        onChange={(e) => setProfileNim(e.target.value)}
                        placeholder="Contoh: 2501234567"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-black transition-all hover:bg-gray-800 cursor-pointer shadow-lg"
                  >
                    {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FEEDBACK REVIEW WRITING MODAL */}
      <AnimatePresence>
        {showFeedbackModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="absolute top-5 right-5 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Beri Ulasan Hidangan
                </h3>
                <p className="text-gray-400 text-xs font-semibold mb-6">Bagikan pendapat Anda mengenai makanan yang Anda pesan.</p>

                <form onSubmit={handleSubmitFeedback} className="space-y-5">
                  {/* Stars rating selection */}
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Rating Bintang</label>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                        >
                          <Star 
                            className={`w-10 h-10 ${
                              star <= feedbackRating 
                                ? "text-amber-500 fill-amber-500 animate-pulse" 
                                : "text-gray-200"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Ulasan / Masukan</label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Bagaimana rasa hidangannya? Berikan komentar Anda..."
                      rows={4}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
                  >
                    {actionLoading ? "Mengirim..." : "Kirim Ulasan Sekarang"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentDashboard;
