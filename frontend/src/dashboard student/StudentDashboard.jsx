import { useState, useEffect } from "react";
import { Search, Wallet, ChevronLeft, MapPin, Star, ShoppingBag, X, ChefHat, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const StudentDashboard = () => {
  
  // State Utama Aplikasi
  const [saldo, setSaldo] = useState(75000);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [cart, setCart] = useState({});
  const [activeOrder, setActiveOrder] = useState(null);
  
  // Simulasi Perubahan Status Order
  useEffect(() => {
    if (!activeOrder) return;
    if (activeOrder.status === "Pending") {
      const timer = setTimeout(() => {
        setActiveOrder((prev) => ({ ...prev, status: "Cooking" }));
      }, 5000); // 5 detik ke dimasak
      return () => clearTimeout(timer);
    } else if (activeOrder.status === "Cooking") {
      const timer = setTimeout(() => {
        setActiveOrder((prev) => ({ ...prev, status: "Ready" }));
      }, 7000); // 7 detik ke siap diambil
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Kategori Populer ala GoFood
  const categories = ["Semua", "Makanan Berat", "Minuman / Coffee", "Camilan", "Sehat"];

  // DATA MASTER RESTORAN & KALOG MENU
  const tenants = [
    {
      id: 1,
      name: "Kantin Ayam Geprek SASC",
      category: "Makanan Berat",
      rating: "4.8",
      distance: "100m dari Kelas",
      promo: "Diskon 10% via BeePay",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
      menus: [
        { id: 101, name: "Ayam Geprek Crispy (Lv 1-5)", price: 18000, isAvailable: true, desc: "Ayam geprek renyah dengan cabai segar asli, nasi hangat, dan lalapan.", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60" },
        { id: 102, name: "Ayam Bakar Madu Binus", price: 20000, isAvailable: true, desc: "Ayam bakar bumbu madu meresap gurih manis pas untuk makan siang.", image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60" }
      ]
    },
    {
      id: 2,
      name: "Kedai Kopi Kampus & Boba",
      category: "Minuman / Coffee",
      rating: "4.9",
      distance: "150m dari Kelas",
      promo: "Buy 1 Get 1 Teatime",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60",
      menus: [
        { id: 201, name: "Ice Caramel Latte", price: 22000, isAvailable: true, desc: "Espresso double shot dengan susu segar dan sirup karamel gurih.", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60" },
        { id: 202, name: "Matcha Glaze Boba", price: 19000, isAvailable: true, desc: "Premium Japanese Matcha dipadu boba kenyal manis.", image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60" }
      ]
    },
    {
      id: 3,
      name: "Gorengan Renyah Kampus",
      category: "Camilan",
      rating: "4.5",
      distance: "200m dari Kelas",
      promo: null,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60",
      menus: [
        { id: 301, name: "Tempe Mendoan (Isi 3)", price: 7000, isAvailable: true, desc: "Tempe mendoan hangat disajikan dengan sambal kecap pedas.", image: "https://images.unsplash.com/photo-1624371414361-e6e2ed58c242?w=500&auto=format&fit=crop&q=60" }
      ]
    }
  ];

  const allGlobalMenus = tenants.flatMap(t => t.menus);

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const handleCheckout = () => {
    if (totalBelanja === 0) return;
    if (saldo < totalBelanja) {
      alert("⚠️ Saldo BeePay tidak mencukupi!");
      return;
    }

    setSaldo((prev) => prev - totalBelanja);
    const itemIds = Object.keys(cart);
    const firstOrderedItem = allGlobalMenus.find((m) => m.id === parseInt(itemIds[0]));

    setActiveOrder({
      id: `BEE-${Math.floor(1000 + Math.random() * 9000)}`,
      tenant: selectedTenant ? selectedTenant.name : "Kantin Kampus",
      menu: `${firstOrderedItem.name} ${itemIds.length > 1 ? `& ${itemIds.length - 1} item lainnya` : ""}`,
      status: "Pending",
      estimate: "10 Mins"
    });

    setCart({});
    setShowMobileCart(false);
    alert("🎉 Pembayaran Sukses! Merchant sedang menyiapkan hidangan Anda.");
  };

  const renderCartContent = () => (
    <>
      <h3 className="font-black text-gray-800 text-lg border-b border-gray-100 pb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-orange-500" /> Basket Pre-Order
      </h3>
      
      {Object.keys(cart).length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
             <ShoppingBag className="w-10 h-10 text-orange-200" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Belum ada item di keranjang.</p>
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

      <div className="pt-4 mt-auto">
        <div className="flex justify-between text-base mb-4">
          <span className="text-gray-500 font-bold">Total Bayar:</span>
          <span className="font-black text-xl text-orange-600">Rp {totalBelanja.toLocaleString("id-ID")}</span>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={totalBelanja === 0}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            totalBelanja > 0 
              ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transform hover:-translate-y-0.5" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Wallet className="w-4 h-4" /> Konfirmasi Bayar
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-24 md:pb-10">
      
      {/* BRANDING HEADER */}
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-40">
        <div className="cursor-pointer flex items-center gap-3" onClick={() => setSelectedTenant(null)}>
          <div className="bg-orange-500 text-white p-2 rounded-xl shadow-sm shadow-orange-500/20">
             <ChefHat className="w-6 h-6" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Bee<span className="text-orange-500">Food</span></h1>
            <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit">Tanpa Antre</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 px-4 py-2.5 rounded-2xl border border-orange-100 flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
               <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">BeePay</p>
              <p className="text-sm font-black text-orange-600 leading-none">Rp {saldo.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* KOLOM UTAMA */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TRACKING STATUS PRE-ORDER */}
          <AnimatePresence>
            {activeOrder && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-3xl border shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden transition-colors duration-500 ${
                  activeOrder.status === "Ready" ? "bg-green-50/50 border-green-200 shadow-green-500/10" : "bg-white border-orange-200 shadow-orange-500/5"
                }`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-500 ${
                  activeOrder.status === "Pending" ? "bg-blue-500" :
                  activeOrder.status === "Cooking" ? "bg-orange-500" : "bg-green-500"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-colors duration-500 ${
                      activeOrder.status === "Pending" ? "bg-blue-500" :
                      activeOrder.status === "Cooking" ? "bg-orange-500" : "bg-green-500"
                    }`}>
                      {activeOrder.status === "Ready" ? "PESANAN SELESAI" : "PROSES PRE-ORDER"}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500">{activeOrder.id}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">{activeOrder.menu}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {activeOrder.tenant} 
                    {activeOrder.status !== "Ready" && (
                      <> • <Clock className="w-3.5 h-3.5 ml-1" /> Est: <span className="text-orange-500 font-bold">{activeOrder.estimate}</span></>
                    )}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 border transition-colors duration-500 w-full md:w-auto justify-center ${
                    activeOrder.status === "Pending" ? "bg-blue-50 border-blue-100" :
                    activeOrder.status === "Cooking" ? "bg-orange-50 border-orange-100" :
                    "bg-green-50 border-green-100"
                  }`}>
                     {activeOrder.status !== "Ready" && (
                       <div className={`w-2 h-2 rounded-full animate-ping ${
                         activeOrder.status === "Pending" ? "bg-blue-500" : "bg-orange-500"
                       }`} />
                     )}
                     <span className={`text-sm font-bold ${
                        activeOrder.status === "Pending" ? "text-blue-700" :
                        activeOrder.status === "Cooking" ? "text-orange-700" : "text-green-700"
                     }`}>
                        {activeOrder.status === "Pending" ? "Menunggu Konfirmasi..." :
                         activeOrder.status === "Cooking" ? "Sedang Dimasak" :
                         "Siap Diambil!"}
                     </span>
                  </div>
                  
                  {activeOrder.status === "Ready" && (
                    <button 
                      onClick={() => setActiveOrder(null)}
                      className="bg-green-500 hover:bg-green-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors w-full md:w-auto"
                    >
                      Konfirmasi Pengambilan
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedTenant ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* PROMO BANNER LIGHT & CLEAN */}
              <div className="relative rounded-3xl overflow-hidden shadow-sm border border-orange-100 bg-white mt-2">
                {/* Soft Gradient Mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30" />
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/30 to-amber-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                {/* Image Background for Desktop */}
                <div className="absolute right-0 top-0 bottom-0 pointer-events-none w-[55%] h-full hidden sm:block">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 w-1/3" />
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80" 
                    alt="Healthy Food" 
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent z-10" />
                </div>

                <div className="relative z-10 p-8 md:p-12 flex justify-between items-center">
                  <div className="max-w-md">
                    <div className="inline-flex items-center gap-2 bg-orange-100/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-200 shadow-sm mb-5">
                      <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Pesan Cepat</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black mb-4 leading-[1.1] tracking-tight text-gray-900">
                      Pesan Sekarang,<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Ambil Nanti!</span>
                    </h2>
                    
                    <p className="text-gray-600 text-sm md:text-base font-medium mb-8 max-w-sm leading-relaxed">
                      Estimasi pengerjaan terpantau real-time. Hindari antrean panjang dan nikmati waktu istirahatmu.
                    </p>
                    
                    <button className="bg-gray-900 text-white font-black px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 text-sm flex items-center gap-2 group">
                      Lihat Menu <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </button>
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
                    placeholder="Cari restoran atau menu..." 
                    className="w-full bg-white py-4 pl-12 pr-4 rounded-2xl border border-gray-200 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-sm shadow-sm"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-2 ${
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

              {/* DAFTAR MERCHANTS */}
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-6">Pilihan Restoran Kantin</h2>
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
                        {tenant.promo && (
                          <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                            {tenant.promo}
                          </span>
                        )}
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
                          <p className="text-xs text-gray-500 font-medium mb-3">{tenant.category}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                           <MapPin className="w-3.5 h-3.5 text-gray-400" />
                           {tenant.distance}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </motion.div>
          ) : (
            
            // DETAIL RESTORAN
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setSelectedTenant(null)}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm transition-all hover:border-orange-200"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
              </button>

              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50" />
                <img src={selectedTenant.image} alt={selectedTenant.name} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl shadow-md z-10" />
                <div className="space-y-2 z-10">
                  <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedTenant.category}
                  </span>
                  <h2 className="text-3xl font-black text-gray-900">{selectedTenant.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedTenant.distance}</span>
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {selectedTenant.rating}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-900 mb-4">Menu Terfavorit</h3>
                <div className="grid gap-4">
                  {selectedTenant.menus.map((menu) => (
                    <div key={menu.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between gap-4">
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-black text-gray-900 text-base">{menu.name}</h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2 pr-4">{menu.desc}</p>
                        </div>
                        <p className="text-orange-600 font-black text-lg mt-3">Rp {menu.price.toLocaleString("id-ID")}</p>
                      </div>
                      
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl relative overflow-hidden shrink-0 group">
                        <img src={menu.image} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80" />
                        
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[85%]">
                          {!cart[menu.id] ? (
                            <button 
                              onClick={() => updateCartQuantity(menu.id, 1)}
                              className="w-full bg-white text-gray-900 hover:text-orange-600 border border-gray-100 text-xs font-black py-2 rounded-xl shadow-lg transition-colors text-center"
                            >
                              Tambah
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-orange-500 text-white text-sm font-black py-1.5 px-1 rounded-xl shadow-lg">
                              <button onClick={() => updateCartQuantity(menu.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg">-</button>
                              <span>{cart[menu.id]}</span>
                              <button onClick={() => updateCartQuantity(menu.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </div>

        {/* KASIR DESKTOP */}
        <div className="hidden lg:block">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-24 flex flex-col">
             {renderCartContent()}
          </div>
        </div>

      </main>

      {/* FLOATING CART BUTTON (MOBILE) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
        <AnimatePresence>
          {totalItems > 0 && !showMobileCart && (
            <motion.button 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={() => setShowMobileCart(true)}
              className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-black border border-gray-800"
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

    </div>
  );
};

export default StudentDashboard;