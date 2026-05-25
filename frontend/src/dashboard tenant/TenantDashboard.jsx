import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, ShoppingBag, Grid, LogOut, Menu, X, Check, ChefHat, Clock, Star, MessageSquare, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const TenantDashboard = () => {
  const navigate = useNavigate();
  
  // Tab State: "orders" | "stock" | "reviews"
  const [currentTab, setCurrentTab] = useState("orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data States
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  // Form/Modal States
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuTime, setNewMenuTime] = useState("");
  const [newMenuImage, setNewMenuImage] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

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
    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/tenants/${user.tenantId}/menus`, {
        name: newMenuName,
        price: parseFloat(newMenuPrice),
        estimatedTime: parseInt(newMenuTime),
        image: newMenuImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"
      }, getHeaders());

      setMenus([...menus, response.data]);
      setShowAddMenuModal(false);
      
      // Reset form
      setNewMenuName("");
      setNewMenuPrice("");
      setNewMenuTime("");
      setNewMenuImage("");
      triggerToast("🎉 Menu hidangan baru berhasil ditambahkan!");
    } catch (err) {
      alert("Gagal menambahkan menu.");
    } finally {
      setActionLoading(false);
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
    : "4.5";

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
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-700">Toko Buka</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black border-2 border-white shadow-sm">
                {user?.name?.charAt(0) || "T"}
             </div>
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
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                                  o.status === "PENDING" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                  o.status === "COOKING" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                  "bg-green-50 text-green-600 border border-green-100"
                                }`}>
                                  {o.status === "PENDING" ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : <ChefHat className="w-3.5 h-3.5" />}
                                  {o.status === "PENDING" ? "Menunggu" : o.status === "COOKING" ? "Dimasak" : "Siap Ambil"}
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
                                    {o.status === "PENDING" ? "Mulai Masak" : "Set Siap Ambil"}
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
                               <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                  o.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                                  o.status === "COOKING" ? "bg-blue-50 text-blue-600" :
                                  "bg-green-50 text-green-600"
                                }`}>
                                  {o.status === "PENDING" ? <Clock className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                                  {o.status === "PENDING" ? "Menunggu" : o.status === "COOKING" ? "Dimasak" : "Siap Ambil"}
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
                                {o.status === "PENDING" ? "Mulai Masak Sekarang" : "Tandai Siap Diambil"}
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

          {/* TAB 2: MANAJEMEN KATALOG & STOK */}
          {currentTab === "stock" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">Manajemen Katalog</h3>
                 <button 
                  onClick={() => setShowAddMenuModal(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-colors cursor-pointer hidden sm:block"
                 >
                    + Tambah Menu Hidangan
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menus.map((s) => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                    <div className="h-40 w-full relative bg-gray-100 overflow-hidden">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {!s.isAvailable && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-lg rotate-12 shadow-lg uppercase tracking-wider">
                            Habis Terjual
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-gray-900 text-base leading-snug">{s.name}</h4>
                        <p className="text-[11px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-orange-500" /> Masak: {s.estimatedTime} menit
                        </p>
                        <p className="text-orange-600 font-black text-lg mt-2">Rp {s.price.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center gap-4">
                        <button
                          onClick={() => handleToggleStock(s.id)}
                          className={`flex-1 flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
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
              
              {/* Floating Action Button Mobile */}
              <button 
                onClick={() => setShowAddMenuModal(true)}
                className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center text-2xl font-light hover:scale-105 transition-transform z-40 cursor-pointer"
              >
                 +
              </button>

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
                    Kantin Ayam Geprek SASC <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 font-semibold leading-relaxed">
                    Ulasan ini ditulis secara riil oleh Mahasiswa Binus setelah mengambil pesanan pre-order mereka di lokasi Anda.
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

                        <p className="text-sm text-gray-600 pt-1 leading-relaxed font-semibold">
                          "{f.comment}"
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          )}

        </div>
      </main>

      {/* ADD MENU MODAL */}
      <AnimatePresence>
        {showAddMenuModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddMenuModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAddMenuModal(false)}
                className="absolute top-5 right-5 p-1.5 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" /> Tambah Hidangan Baru
              </h3>

              <form onSubmit={handleAddMenu} className="space-y-4">
                {/* Menu Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Nama Hidangan</label>
                  <input
                    type="text"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="Contoh: Nasi Goreng Gila"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                    required
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Harga Menu (Rp)</label>
                  <input
                    type="number"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    placeholder="Contoh: 15000"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                    required
                  />
                </div>

                {/* Cook Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Estimasi Waktu Masak (Menit)</label>
                  <input
                    type="number"
                    value={newMenuTime}
                    onChange={(e) => setNewMenuTime(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">URL Foto Makanan (Opsional)</label>
                  <input
                    type="url"
                    value={newMenuImage}
                    onChange={(e) => setNewMenuImage(e.target.value)}
                    placeholder="Contoh: https://images.unsplash.com/..."
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full mt-4 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg cursor-pointer"
                >
                  {actionLoading ? "Memproses..." : "Tambah Menu Hidangan"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TenantDashboard;