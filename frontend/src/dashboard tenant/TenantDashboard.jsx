import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, ShoppingBag, Grid, LogOut, Menu, X, Check, ChefHat, Clock, Star, MessageSquare, Plus, CheckCircle2, User, Phone, MapPin, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { compressImageFile } from "../utils/compressImage";

const API_URL = "http://localhost:5000/api";

const getApiErrorMessage = (err, fallback) =>
  err?.response?.data?.error || err?.message || fallback;

const TenantDashboard = () => {
  const navigate = useNavigate();
  
  // Tab State: "orders" | "stock" | "addMenu" | "reviews" | "profile"
  const [currentTab, setCurrentTab] = useState("orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data States
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuTime, setNewMenuTime] = useState("");
  const [newMenuImage, setNewMenuImage] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Profile Form States
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantLocation, setTenantLocation] = useState("");
  const [tenantIsOpen, setTenantIsOpen] = useState(true);
  const [tenantImage, setTenantImage] = useState("");

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phoneNumber || "");
      setTenantName(user.tenant?.name || "");
      setTenantLocation(user.tenant?.location || "");
      setTenantIsOpen(user.tenant?.isOpen !== false);
      setTenantImage(user.tenant?.image || "");
    }
  }, [user]);

  const getHeaders = () => {
    const token = localStorage.getItem("beefood_token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch profile to find linked tenantId
      const profileRes = await axios.get(`${API_URL}/profile`, getHeaders());
      setUser(profileRes.data);

      const tenantId = profileRes.data.tenantId;
      if (!tenantId) {
        alert("Akun Anda tidak terhubung ke tenant mana pun.");
        navigate("/");
        return;
      }

      // Fetch active/past orders
      const ordersRes = await axios.get(`${API_URL}/orders/tenant/${tenantId}`, getHeaders());
      setOrders(ordersRes.data);

      // Fetch menus
      const tenantsRes = await axios.get(`${API_URL}/tenants`);
      const currentTenant = tenantsRes.data.find(t => t.id === tenantId);
      if (currentTenant) {
        setMenus(currentTenant.menus);
      }

      // Fetch feedback
      const feedbackRes = await axios.get(`${API_URL}/tenants/${tenantId}/feedback`);
      setFeedback(feedbackRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      localStorage.removeItem("beefood_token");
      localStorage.removeItem("beefood_user");
      navigate("/");
    }
  };

  useEffect(() => {
    fetchData();
    // Poll orders & feedback every 6 seconds
    const interval = setInterval(async () => {
      if (user?.tenantId) {
        try {
          const ordersRes = await axios.get(`${API_URL}/orders/tenant/${user.tenantId}`, getHeaders());
          setOrders(ordersRes.data);
          
          const feedbackRes = await axios.get(`${API_URL}/tenants/${user.tenantId}/feedback`);
          setFeedback(feedbackRes.data);
        } catch (e) {
          console.error("Poller error:", e);
        }
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [user?.tenantId]);

  // Change order status (PENDING -> COOKING -> READY)
  const handleChangeStatus = async (orderId, currentStatus) => {
    setActionLoading(true);
    let nextStatus = "COOKING";
    if (currentStatus === "COOKING") nextStatus = "READY";
    
    try {
      await axios.patch(`${API_URL}/orders/${orderId}`, { status: nextStatus }, getHeaders());
      triggerToast(`🎉 Pesanan BEE-${orderId} status diupdate ke ${nextStatus === "COOKING" ? "Sedang Dimasak" : "Siap Diambil"}!`);
      
      // Refresh orders
      const ordersRes = await axios.get(`${API_URL}/orders/tenant/${user.tenantId}`, getHeaders());
      setOrders(ordersRes.data);
    } catch (err) {
      alert("Gagal mengubah status pesanan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Menu Availability
  const handleToggleStock = async (menuId) => {
    try {
      await axios.patch(`${API_URL}/menus/${menuId}/toggle`, {}, getHeaders());
      
      // Update local state
      setMenus(menus.map(m => m.id === menuId ? { ...m, isAvailable: !m.isAvailable } : m));
      triggerToast("✅ Ketersediaan menu berhasil diupdate!");
    } catch (err) {
      alert("Gagal mengupdate ketersediaan menu.");
    }
  };

  // Add New Menu
  const handleAddMenu = async (e) => {
    e.preventDefault();

    if (!user?.tenantId) {
      alert("Akun Anda tidak terhubung ke outlet. Silakan hubungi admin atau daftar ulang sebagai tenant.");
      return;
    }

    const priceNum = parseFloat(newMenuPrice);
    const timeNum = parseInt(newMenuTime, 10);
    if (!newMenuName.trim()) {
      alert("Nama hidangan wajib diisi.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      alert("Harga harus angka lebih dari 0.");
      return;
    }
    if (Number.isNaN(timeNum) || timeNum <= 0) {
      alert("Estimasi waktu masak harus angka lebih dari 0.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/tenants/${user.tenantId}/menus`, {
        name: newMenuName.trim(),
        price: priceNum,
        estimatedTime: timeNum,
        image: newMenuImage || undefined
      }, getHeaders());

      setMenus([...menus, response.data]);
      setNewMenuName("");
      setNewMenuPrice("");
      setNewMenuTime("");
      setNewMenuImage("");
      setCurrentTab("stock");
      triggerToast("Menu hidangan baru berhasil ditambahkan!");
    } catch (err) {
      alert(getApiErrorMessage(err, "Gagal menambahkan menu. Pastikan backend berjalan dan coba lagi."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMenuImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNewMenuImage("");
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      setNewMenuImage(compressed);
    } catch {
      alert("Gagal memproses foto menu. Coba file JPG/PNG lain.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        name: profileName,
        phoneNumber: profilePhone,
        tenantName,
        tenantLocation,
        tenantIsOpen,
        tenantImage
      };
      
      const res = await axios.put(`${API_URL}/profile`, payload, getHeaders());
      const updated = res.data.user;
      setUser(updated);
      setTenantName(updated.tenant?.name ?? tenantName);
      setTenantLocation(updated.tenant?.location ?? tenantLocation);
      setTenantIsOpen(updated.tenant?.isOpen !== false);
      setTenantImage(updated.tenant?.image ?? tenantImage);
      triggerToast("Profil tenant berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, "Gagal memperbarui profil. Foto terlalu besar atau backend belum di-restart."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTenantImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.75);
      setTenantImage(compressed);
      triggerToast("Foto dipilih — tekan Simpan Perubahan untuk menyimpan.");
    } catch {
      alert("Gagal memproses foto outlet. Coba file JPG/PNG lain.");
    }
  };

  const closeSidebar = () => setIsSidebarOpen(false);

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
          <p className="font-bold text-gray-500 text-sm">Memuat dasbor tenant...</p>
        </div>
      </div>
    );
  }

  // Filter orders
  const activeOrders = orders.filter(o => o.status !== "DONE");
  const completedOrders = orders.filter(o => o.status === "DONE");

  // Calculate average rating
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "0";

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 pb-8 flex items-center gap-3 border-b border-gray-100">
        <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
           <Store className="w-6 h-6" />
        </div>
        <div>
           <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Bee<span className="text-orange-500">Food</span></h1>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tenant Panel</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <button
          onClick={() => { setCurrentTab("orders"); closeSidebar(); }}
          className={`w-full p-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
            currentTab === "orders" 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 translate-x-1" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Antrean Pesanan ({activeOrders.length})</span>
        </button>
        
        <button
          onClick={() => { setCurrentTab("stock"); closeSidebar(); }}
          className={`w-full p-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
            currentTab === "stock" 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 translate-x-1" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Grid className="w-5 h-5" />
          <span>Katalog Menu & Stok</span>
        </button>

        <button
          onClick={() => { setCurrentTab("reviews"); closeSidebar(); }}
          className={`w-full p-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
            currentTab === "reviews" 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 translate-x-1" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Ulasan Pelanggan ({feedback.length})</span>
        </button>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar Dasbor</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans relative">
      
      {/* TOAST SUCCESS */}
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

      {/* DESKTOP SIDEBAR */}
      <aside className="w-72 hidden md:block fixed left-0 top-0 h-screen border-r border-gray-100 z-20 shadow-sm">
        {renderSidebarContent()}
      </aside>

      {/* MOBILE SIDEBAR & OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed left-0 top-0 w-[80%] max-w-sm h-screen z-50 md:hidden shadow-2xl"
            >
              {renderSidebarContent()}
              <button 
                onClick={closeSidebar}
                className="absolute top-6 right-6 p-2 bg-gray-100 text-gray-500 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-72 w-full flex flex-col min-h-screen">
        
        {/* Header Dashboard */}
        <header className="bg-white flex justify-between items-center px-6 md:px-8 py-5 border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dashboard Tenant</p>
              <h2 className="text-xl font-black text-gray-900 leading-tight">{user?.tenant?.name || "BeeFood Tenant"}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
               tenantIsOpen ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
             }`}>
                <div className={`w-2 h-2 rounded-full ${tenantIsOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className={`text-xs font-bold ${tenantIsOpen ? "text-green-700" : "text-red-700"}`}>
                  {tenantIsOpen ? "Toko Buka" : "Toko Tutup"}
                </span>
             </div>
             <button
               type="button"
               onClick={() => setCurrentTab("profile")}
               title="Profil & pengaturan toko"
               className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black border-2 border-white shadow-sm hover:ring-2 hover:ring-orange-200 transition-all cursor-pointer overflow-hidden"
             >
               {tenantImage ? (
                 <img src={tenantImage} alt="" className="w-full h-full object-cover" />
               ) : (
                 user?.name?.charAt(0) || "T"
               )}
             </button>
          </div>
        </header>

        {/* Content View */}
        <div className="p-6 md:p-8 flex-1">
          
          {/* TAB 1: ANTREAN PESANAN MAHASISWA */}
          {currentTab === "orders" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">Pre-Order Masuk</h3>
                 <span className="text-sm font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{activeOrders.length} Pesanan Aktif</span>
              </div>
              
              {activeOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
                  <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-bounce" />
                  <h4 className="font-bold text-gray-700 text-base">Belum Ada Antrean</h4>
                  <p className="text-gray-400 text-sm mt-1">Pesanan baru dari mahasiswa akan muncul di sini secara real-time.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                          <th className="p-5">ID Order</th>
                          <th className="p-5">Pemesan</th>
                          <th className="p-5">Detail Pesanan</th>
                          <th className="p-5">Total Harga</th>
                          <th className="p-5">Status</th>
                          <th className="p-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activeOrders.map((o) => {
                          const itemsDetail = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                          return (
                            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-5 font-black text-gray-900">BEE-{o.id}</td>
                              <td className="p-5">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-700">{o.user?.name}</span>
                                  <span className="text-[10px] font-mono text-gray-400">NIM: {o.user?.nim || "-"} • Telp: {o.user?.phoneNumber || "-"}</span>
                                </div>
                              </td>
                              <td className="p-5">
                                 <div className="flex flex-col gap-0.5">
                                    {itemsDetail.map((it, idx) => (
                                      <span key={idx} className="font-bold text-gray-900 text-sm">
                                        {it.name} <span className="text-orange-500">x{it.qty}</span>
                                      </span>
                                    ))}
                                 </div>
                              </td>
                              <td className="p-5 font-black text-gray-800">Rp {o.totalPrice.toLocaleString("id-ID")}</td>
                              <td className="p-5">
                                <span className={`px-3.5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 uppercase shadow-sm tracking-wider ${
                                  o.status === "PENDING" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse" :
                                  o.status === "COOKING" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" :
                                  "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                                }`}>
                                  {o.status === "PENDING" && <Clock className="w-3.5 h-3.5 animate-spin" />}
                                  {o.status === "COOKING" && <ChefHat className="w-3.5 h-3.5" />}
                                  {o.status === "READY" && <Check className="w-3.5 h-3.5" />}
                                  {o.status === "PENDING" ? "Menunggu ACC" : o.status === "COOKING" ? "Sedang Dimasak" : "Siap Diambil!"}
                                </span>
                              </td>
                              <td className="p-5 text-right">
                                {o.status !== "READY" ? (
                                  <button
                                    onClick={() => handleChangeStatus(o.id, o.status)}
                                    disabled={actionLoading}
                                    className={`text-xs font-black px-4.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer ${
                                      o.status === "PENDING" 
                                        ? "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-blue-500/20" 
                                        : "bg-green-500 hover:bg-green-600 text-white hover:shadow-green-500/20"
                                    }`}
                                  >
                                    {o.status === "PENDING" ? "ACC Pesanan" : "Set Siap Ambil"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 font-bold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                                    Siap Diambil Mahasiswa
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                     {activeOrders.map(o => {
                       const itemsDetail = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                       return (
                         <div key={o.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                            <div className="flex justify-between items-start">
                                <div>
                                   <span className="text-xs font-black text-gray-400 uppercase">BEE-{o.id}</span>
                                   <h4 className="font-black text-lg text-gray-900 mt-1">{o.user?.name}</h4>
                                   <p className="text-[10px] text-gray-400 font-semibold">NIM: {o.user?.nim || "-"} • Telp: {o.user?.phoneNumber || "-"}</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 text-white shadow-sm ${
                                  o.status === "PENDING" ? "bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" :
                                  o.status === "COOKING" ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
                                  "bg-gradient-to-r from-emerald-500 to-green-600"
                                }`}>
                                  {o.status === "PENDING" ? "Menunggu ACC" : o.status === "COOKING" ? "Sedang Dimasak" : "Siap Diambil!"}
                                </span>
                             </div>
                            
                            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-sm">
                               <div className="flex flex-col gap-1.5 mb-2">
                                  {itemsDetail.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                      <span className="font-bold text-gray-900">{it.name}</span>
                                      <span className="font-black text-orange-500">x{it.qty}</span>
                                    </div>
                                  ))}
                               </div>
                               <div className="flex justify-between border-t border-gray-100 pt-2 mt-1 font-black text-gray-900">
                                 <span>Total Harga:</span>
                                 <span>Rp {o.totalPrice.toLocaleString("id-ID")}</span>
                               </div>
                            </div>

                            {o.status !== "READY" ? (
                              <button
                                onClick={() => handleChangeStatus(o.id, o.status)}
                                disabled={actionLoading}
                                className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                                  o.status === "PENDING" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                                }`}
                              >
                                {o.status === "PENDING" ? "ACC Pesanan" : "Tandai Siap Diambil"}
                              </button>
                            ) : (
                              <div className="w-full py-3 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs text-gray-400 font-bold">
                                Menunggu Mahasiswa Konfirmasi Pick Up
                              </div>
                            )}
                         </div>
                       );
                     })}
                  </div>
                </>
              )}

              {/* SELESAI HISTORY SECTION */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-black text-gray-700">Pre-Order Selesai (Riwayat)</h3>
                
                {completedOrders.length === 0 ? (
                  <p className="text-sm text-gray-400">Belum ada riwayat pesanan selesai.</p>
                ) : (
                  <div className="space-y-3">
                    {completedOrders.map((o) => {
                      const itemsDetail = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                      return (
                        <div key={o.id} className="bg-white border border-gray-100 p-4.5 rounded-2xl text-sm flex justify-between items-center text-gray-600">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-400 block">ORDER ID: BEE-{o.id}</span>
                            <span className="font-bold text-gray-900">{o.user?.name}</span> • {" "}
                            {itemsDetail.map(it => `${it.name} x${it.qty}`).join(", ")}
                            <p className="text-[11px] text-gray-400 font-semibold mt-1">Rp {o.totalPrice.toLocaleString("id-ID")} • Status: Selesai Diambil</p>
                          </div>
                          
                          {o.feedback && (
                            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100 shrink-0 text-amber-700 font-bold text-xs">
                              {o.feedback.rating} <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: DAFTAR HIDANGAN AKTIF */}
          {currentTab === "stock" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Daftar Hidangan Aktif</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">Kelola stok menu yang tampil di aplikasi mahasiswa</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab("addMenu")}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/25 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Tambah Hidangan</span>
                </button>
              </div>

              {menus.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-700 text-base">Belum Ada Menu</h4>
                  <p className="text-gray-400 text-sm mt-1 mb-6">Tekan tombol tambah untuk memasukkan hidangan pertama.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentTab("addMenu")}
                    className="inline-flex items-center gap-2 bg-orange-500 text-white font-black text-sm px-5 py-3 rounded-2xl"
                  >
                    <Plus className="w-5 h-5" /> Tambah Hidangan Baru
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {menus.map((s) => (
                    <div key={s.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                      <div className="h-40 w-full relative bg-gray-100 overflow-hidden">
                        <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {!s.isAvailable && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider">
                              Habis
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-gray-900 text-base leading-snug">{s.name}</h4>
                          <p className="text-[11px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-orange-500" /> {s.estimatedTime} menit
                          </p>
                          <p className="text-orange-600 font-black text-lg mt-2">Rp {s.price.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-gray-50">
                          <button
                            onClick={() => handleToggleStock(s.id)}
                            className={`w-full flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
                              s.isAvailable
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {s.isAvailable ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            {s.isAvailable ? "Set Habis" : "Set Tersedia"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: TAMBAH HIDANGAN BARU (halaman terpisah) */}
          {currentTab === "addMenu" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setCurrentTab("stock")}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 mb-6 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Menu
              </button>

              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-500" /> Tambah Hidangan Baru
                </h3>

                <form onSubmit={handleAddMenu} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Hidangan</label>
                    <input
                      type="text"
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      placeholder="Contoh: Nasi Goreng Spesial"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Harga (Rp)</label>
                    <input
                      type="number"
                      value={newMenuPrice}
                      onChange={(e) => setNewMenuPrice(e.target.value)}
                      placeholder="15000"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Estimasi Masak (menit)</label>
                    <input
                      type="number"
                      value={newMenuTime}
                      onChange={(e) => setNewMenuTime(e.target.value)}
                      placeholder="10"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Foto (opsional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMenuImageFileChange}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:font-black file:bg-orange-50 file:text-orange-700"
                    />
                    {newMenuImage && (
                      <img src={newMenuImage} alt="Preview" className="w-full h-36 object-cover rounded-2xl mt-2" />
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black disabled:opacity-60"
                  >
                    {actionLoading ? "Menyimpan..." : "Simpan Hidangan"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CUSTOMER REVIEWS & FEEDBACK */}
          {currentTab === "reviews" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-gray-900">Ulasan Pelanggan</h3>
                <span className="text-sm font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{feedback.length} Ulasan</span>
              </div>

              {/* Rating Stats Card */}
              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-6">
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-center shrink-0">
                  <span className="text-4xl font-black text-orange-600 block">{avgRating}</span>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mt-1">Skor Rating</span>
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg flex items-center gap-1.5">
                    {user?.tenant?.name || tenantName || "Outlet Anda"}
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 font-semibold leading-relaxed">
                    Ulasan dari mahasiswa yang sudah mengambil pesanan di outlet Anda.
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {feedback.length === 0 ? (
                  <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center shadow-sm text-gray-400">
                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Belum ada ulasan atau rating dari pelanggan.</p>
                  </div>
                ) : (
                  feedback.map((f) => (
                    <div key={f.id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex items-start gap-4 transition-all hover:border-orange-100">
                      <img src={f.studentAvatar} alt={f.studentName} className="w-10 h-10 rounded-full border border-gray-200 bg-orange-50 shrink-0" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-gray-900 text-sm">{f.studentName}</span>
                          <span className="text-xs text-gray-400 font-bold">{new Date(f.createdAt).toLocaleDateString("id-ID")}</span>
                        </div>
                        
                        {/* Rating stars */}
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <Star 
                              key={star} 
                              className={`w-3.5 h-3.5 ${
                                star <= f.rating ? "text-amber-500 fill-amber-500" : "text-gray-200"
                              }`} 
                            />
                          ))}
                        </div>

                        {f.orderSummary && (
                          <p className="text-[11px] text-gray-400 font-bold mt-1">
                            Pesanan: {f.orderSummary}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 pt-1 leading-relaxed font-semibold">
                          {f.comment ? `"${f.comment}"` : "(Tanpa komentar)"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 4: PROFIL BISNIS TENANT */}
          {currentTab === "profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
              <button
                type="button"
                onClick={() => setCurrentTab("orders")}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali ke Antrean
              </button>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-gray-900">Profil & Pengaturan Toko</h3>
                <span className="text-xs font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  Akun Tenant
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Preview Toko (Kiri) - 5 cols */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col group">
                    <div className="h-48 w-full relative bg-gray-100 overflow-hidden">
                      <img 
                        src={tenantImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"} 
                        alt={tenantName || "Kantin"} 
                        className="w-full h-full object-cover transition-transform duration-500" 
                      />
                      <span className={`absolute top-3 left-3 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg ${
                        tenantIsOpen ? "bg-green-500" : "bg-red-500"
                      }`}>
                        {tenantIsOpen ? "BUKA" : "TUTUP"}
                      </span>
                    </div>
                    <div className="p-5">
                      <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{tenantName || "Nama Kantin Belum Diisi"}</h4>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" /> {tenantLocation || "Lokasi Belum Diisi"}
                      </p>
                      
                      <div className="flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>{avgRating} ({feedback.length} Ulasan)</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <div>{menus.length} Menu Hidangan</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 space-y-2">
                    <h4 className="font-black text-orange-800 text-sm">Informasi Keaktifan</h4>
                    <p className="text-xs text-orange-700 font-semibold leading-relaxed">
                      Status keaktifan toko memengaruhi apakah Mahasiswa dapat melihat menu hidangan Anda di beranda mereka. Pastikan status diubah ke Buka ketika Anda siap melayani pre-order.
                    </p>
                  </div>
                </div>

                {/* Form Edit Profil (Kanan) - 7 cols */}
                <form onSubmit={handleSaveProfile} className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                      Profil Pemilik (Tenant Owner)
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Owner Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Pemilik</label>
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

                      {/* Phone Number */}
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
                            placeholder="Contoh: 081298765432"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                      Profil Bisnis & Outlet
                    </h4>

                    <div className="space-y-4">
                      {/* Kantin Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Kantin / Outlet</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Store className="h-4.5 w-4.5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={tenantName}
                            onChange={(e) => setTenantName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                            required
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Lokasi Kantin</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="h-4.5 w-4.5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={tenantLocation}
                            onChange={(e) => setTenantLocation(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                            required
                          />
                        </div>
                      </div>

                      {/* Store Status Toggle */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Status Toko</label>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setTenantIsOpen(true)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              tenantIsOpen 
                                ? "bg-green-500 text-white shadow-md shadow-green-500/20" 
                                : "bg-white text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200"
                            }`}
                          >
                            Buka / Aktif
                          </button>
                          <button
                            type="button"
                            onClick={() => setTenantIsOpen(false)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              !tenantIsOpen 
                                ? "bg-red-500 text-white shadow-md shadow-red-500/20" 
                                : "bg-white text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200"
                            }`}
                          >
                            Tutup / Libur
                          </button>
                        </div>
                      </div>

                      {/* Outlet Image */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Foto Outlet / Kantin</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleTenantImageFileChange}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-xs font-semibold file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        <p className="text-[11px] text-gray-400 font-semibold">
                          Pilih foto lalu klik <strong>Simpan Perubahan</strong> di bawah. Gambar salad adalah foto default sistem.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg hover:shadow-orange-500/25 cursor-pointer disabled:opacity-60"
                  >
                    {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </div>
      </main>



    </div>
  );
};

export default TenantDashboard;
