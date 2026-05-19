import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, ShoppingBag, Grid, LogOut, Menu, X, Check, ChefHat, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Simulasi Antrean Masuk dari Mahasiswa
  const [orders, setOrders] = useState([
    { id: "ORD-8042", user: "Evan (Student)", menu: "Ayam Geprek Crispy", qty: 1, method: "BeePay", status: "Cooking" },
    { id: "ORD-1299", user: "Herlinda (Student)", menu: "Ice Caramel Latte", qty: 2, method: "BeePay", status: "Pending" },
  ]);

  // Katalog Penjual
  const [stockMenu, setStockMenu] = useState([
    { id: 1, name: "Ayam Geprek Crispy", price: "Rp 18.000", isAvailable: true, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60" },
    { id: 2, name: "Ice Caramel Latte", price: "Rp 22.000", isAvailable: true, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60" },
    { id: 3, name: "Tempe Mendoan (Isi 3)", price: "Rp 7.000", isAvailable: false, image: "https://images.unsplash.com/photo-1624371414361-e6e2ed58c242?w=500&auto=format&fit=crop&q=60" },
  ]);

  const changeStatus = (id) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: o.status === "Pending" ? "Cooking" : "Ready" } : o));
  };

  const toggleStock = (id) => {
    setStockMenu(stockMenu.map(s => s.id === id ? { ...s, isAvailable: !s.isAvailable } : s));
  };

  const closeSidebar = () => setIsSidebarOpen(false);

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
          className={`w-full p-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all ${
            currentTab === "orders" 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 translate-x-1" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Antrean Pesanan</span>
        </button>
        <button
          onClick={() => { setCurrentTab("stock"); closeSidebar(); }}
          className={`w-full p-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all ${
            currentTab === "stock" 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 translate-x-1" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Grid className="w-5 h-5" />
          <span>Katalog Menu & Stok</span>
        </button>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => navigate("/")} 
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar Dasbor</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      
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
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dashboard</p>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Ayam Geprek SASC</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-700">Toko Buka</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black border-2 border-white shadow-sm">
                S
             </div>
          </div>
        </header>

        {/* Content View */}
        <div className="p-6 md:p-8 flex-1">
          {currentTab === "orders" ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">Pre-Order Masuk</h3>
                 <span className="text-sm font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{orders.length} Pesanan</span>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <th className="p-5">ID Order</th>
                      <th className="p-5">Pemesan</th>
                      <th className="p-5">Detail Pesanan</th>
                      <th className="p-5">Pembayaran</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 font-black text-gray-900">{o.id}</td>
                        <td className="p-5 font-semibold text-gray-700">{o.user}</td>
                        <td className="p-5">
                           <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{o.menu}</span>
                              <span className="text-xs text-gray-400 font-medium mt-0.5">Qty: {o.qty}</span>
                           </div>
                        </td>
                        <td className="p-5">
                          <span className="bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1.5 rounded-lg border border-gray-200">
                            {o.method}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                            o.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {o.status === "Pending" ? <Clock className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                            {o.status === "Pending" ? "Menunggu" : "Dimasak"}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => changeStatus(o.id)}
                            className={`text-sm font-black px-4 py-2 rounded-xl transition-all shadow-sm ${
                              o.status === "Pending" 
                                ? "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-blue-500/20" 
                                : "bg-green-500 hover:bg-green-600 text-white hover:shadow-green-500/20"
                            }`}
                          >
                            {o.status === "Pending" ? "Mulai Masak" : "Set Siap Ambil"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                 {orders.map(o => (
                   <div key={o.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                      <div className="flex justify-between items-start">
                         <div>
                            <span className="text-xs font-black text-gray-400 uppercase">{o.id}</span>
                            <h4 className="font-black text-lg text-gray-900 mt-1">{o.user}</h4>
                         </div>
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            o.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {o.status === "Pending" ? <Clock className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                            {o.status === "Pending" ? "Menunggu" : "Dimasak"}
                          </span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-sm">
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900">{o.menu}</span>
                            <span className="font-black text-orange-500">x{o.qty}</span>
                         </div>
                         <span className="text-xs text-gray-500 font-medium">Via {o.method}</span>
                      </div>

                      <button
                        onClick={() => changeStatus(o.id)}
                        className={`w-full py-3 rounded-xl text-sm font-black transition-all shadow-sm ${
                          o.status === "Pending" 
                            ? "bg-blue-500 text-white" 
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {o.status === "Pending" ? "Mulai Masak Sekarang" : "Tandai Siap Diambil"}
                      </button>
                   </div>
                 ))}
              </div>

            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">Manajemen Katalog</h3>
                 <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors hidden sm:block">
                    + Tambah Menu
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stockMenu.map((s) => (
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
                        <p className="text-orange-600 font-black text-lg mt-2">{s.price}</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center gap-4">
                        <button
                          onClick={() => toggleStock(s.id)}
                          className={`flex-1 flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-colors ${
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
              <button className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center text-2xl font-light hover:scale-105 transition-transform z-40">
                 +
              </button>

            </motion.div>
          )}
        </div>
      </main>

    </div>
  );
};

export default TenantDashboard;