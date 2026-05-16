import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  // State Utama Aplikasi
  const [saldo, setSaldo] = useState(75000);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [cart, setCart] = useState({});
  const [activeOrder, setActiveOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Kategori Populer ala GoFood
  const categories = ["Semua", "Makanan Berat", "Minuman / Coffee", "Camilan", "Sehat"];

  // DATA MASTER RESTORAN & KALOG MENU (FR 3)
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

  // Logika Filter Pencarian & Kategori ala GoFood
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
    alert("🎉 Pembayaran Sukses! Merchant GoFood-BeeFood sedang menyiapkan hidangan Anda.");
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-gray-800 font-sans pb-20">
      
      {/* BRANDING HEADER */}
      <div className="bg-white px-8 py-4 shadow-sm flex justify-between items-center border-b border-gray-100 sticky top-0 z-40">
        <div className="cursor-pointer" onClick={() => setSelectedTenant(null)}>
          <h1 className="text-2xl font-black text-[#EE6425] tracking-tight flex items-center gap-1.5">
            <span className="text-3xl">🐝</span> bee<span className="text-amber-500">food</span>
          </h1>
          <p className="text-[11px] text-gray-400 font-semibold tracking-wide uppercase">Cepat • Hemat • Tanpa Antre</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Dompet BeePay</p>
            <p className="text-sm font-black text-[#EE6425]">Rp {saldo.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto grid grid-cols-4 max-xl:grid-cols-1 gap-8">
        
        {/* KOLOM KIRI & TENGAH: RESTORAN / MENU */}
        <div className="col-span-3 space-y-6">
          
          {/* TRACKING STATUS PRE-ORDER (FR 4) */}
          {activeOrder && (
            <div className="bg-white p-5 rounded-2xl border-2 border-orange-500 shadow-sm animate-fade-in flex justify-between items-center max-sm:flex-col max-sm:items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">PROSES PRE-ORDER</span>
                  <span className="text-xs font-mono font-bold text-gray-500">{activeOrder.id}</span>
                </div>
                <h3 className="text-base font-black text-gray-800">{activeOrder.menu}</h3>
                <p className="text-xs text-gray-400">{activeOrder.tenant} • Estimasi Ambil: <span className="text-orange-500 font-bold">{activeOrder.estimate}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-2 rounded-xl animate-pulse">
                  🍳 Sedang Dimasak...
                </span>
              </div>
            </div>
          )}

          {/* JIKA BERADA DI HALAMAN UTAMA (LIST RESTORAN) */}
          {!selectedTenant ? (
            <div className="space-y-6">
              
              {/* GOFOOD PROMO BANNER MINI */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-sm flex justify-between items-center">
                <div>
                  <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full uppercase">Mager Antre Kelas?</span>
                  <h2 className="text-2xl font-black mt-2 max-sm:text-xl">Pesan via BeeFood, Tinggal Ambil!</h2>
                  <p className="text-white/80 text-xs mt-1">Estimasi pengerjaan terpantau real-time langsung dari smartphone kamu.</p>
                </div>
                <span className="text-5xl max-sm:hidden">🍱</span>
              </div>

              {/* SEARCH BAR & FILTER KATEGORI */}
              <div className="space-y-3">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Mau makan apa hari ini di kantin Binus?..." 
                    className="w-full bg-white p-4 pl-12 rounded-2xl border border-gray-200 outline-none focus:border-orange-500 font-medium text-sm transition shadow-inner"
                  />
                  <span className="absolute left-4 top-4 text-gray-400">🔍</span>
                </div>

                {/* Pil Filter Kategori Populer */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                        selectedCategory === cat 
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm" 
                          : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* DAFTAR MERCHANTS / OUTLETS RESTORAN */}
              <div>
                <h2 className="text-lg font-black text-gray-800 mb-4">Semua Restoran Terdekat</h2>
                <div className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-5">
                  {filteredTenants.map((tenant) => (
                    <div 
                      key={tenant.id}
                      onClick={() => setSelectedTenant(tenant)}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="h-36 w-full relative bg-gray-100">
                        <img src={tenant.image} alt={tenant.name} className="w-full h-full object-cover" />
                        {tenant.promo && (
                          <span className="absolute bottom-3 left-3 bg-[#EE6425] text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow">
                            🎁 {tenant.promo}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-black text-gray-800 text-sm truncate">{tenant.name}</h3>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{tenant.category}</p>
                        
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-bold bg-gray-50 p-2 rounded-xl">
                          <span className="text-amber-500">⭐ {tenant.rating}</span>
                          <span>•</span>
                          <span className="text-[11px]">{tenant.distance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            
            // JIKA MASUK KE DETAIL RESTORAN (GOFOOD MENU VIEW)
            <div className="space-y-6 animate-fade-in">
              <button 
                onClick={() => setSelectedTenant(null)}
                className="text-xs font-black text-gray-500 hover:text-orange-500 bg-white border border-gray-100 px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                ← Kembali ke Beranda BeeFood
              </button>

              {/* Jumbotron Deskripsi Restoran */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 max-sm:flex-col max-sm:items-start">
                <img src={selectedTenant.image} alt={selectedTenant.name} className="w-28 h-28 object-cover rounded-2xl shadow-inner bg-gray-50" />
                <div className="space-y-1">
                  <span className="bg-orange-50 text-[#EE6425] text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-orange-100 uppercase">
                    {selectedTenant.category}
                  </span>
                  <h2 className="text-2xl font-black text-gray-800">{selectedTenant.name}</h2>
                  <p className="text-xs text-gray-400 font-semibold">📍 {selectedTenant.location} • ⭐ {selectedTenant.rating}</p>
                  {selectedTenant.promo && <p className="text-xs text-green-600 font-bold">✨ Promo: {selectedTenant.promo}</p>}
                </div>
              </div>

              {/* LIST MENU BERGAYA KARTU GOFOOD */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-gray-700">Pilihan Menu Terfavorit</h3>
                <div className="space-y-3">
                  {selectedTenant.menus.map((menu) => (
                    <div key={menu.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between gap-4 items-center">
                      <div className="flex-1 space-y-1 pr-4">
                        <h4 className="font-black text-gray-800 text-sm leading-snug">{menu.name}</h4>
                        <p className="text-xs text-gray-400 font-medium line-clamp-2">{menu.desc}</p>
                        <p className="text-[#EE6425] font-black text-base pt-1">Rp {menu.price.toLocaleString("id-ID")}</p>
                      </div>
                      
                      <div className="w-28 h-28 max-sm:w-24 max-sm:h-24 bg-gray-50 rounded-2xl relative overflow-hidden shadow-inner flex-shrink-0">
                        <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                        
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[85%]">
                          {!cart[menu.id] ? (
                            <button 
                              onClick={() => updateCartQuantity(menu.id, 1)}
                              className="w-full bg-white text-[#EE6425] hover:bg-orange-50 border border-gray-100 text-xs font-black py-1.5 rounded-xl shadow-md transition uppercase text-center"
                            >
                              Tambah
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-[#EE6425] text-white text-xs font-black py-1.5 px-2 rounded-xl shadow-md">
                              <button onClick={() => updateCartQuantity(menu.id, -1)} className="px-1 hover:bg-black/10 rounded">-</button>
                              <span>{cart[menu.id]}</span>
                              <button onClick={() => updateCartQuantity(menu.id, 1)} className="px-1 hover:bg-black/10 rounded">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 3. KASIR KERANJANG SISI KANAN LAYOUT GOFOOD */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-4 sticky top-24">
          <h3 className="font-black text-gray-800 text-sm border-b border-gray-50 pb-3 flex items-center gap-1.5">
            🛒 Basket Pre-Order
          </h3>
          
          {Object.keys(cart).length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl block mb-2">🍕</span>
              <p className="text-xs text-gray-400 font-medium italic">Belum ada item di keranjang belanja kamu.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {Object.keys(cart).map((id) => {
                const matchedMenu = allGlobalMenus.find((m) => m.id === parseInt(id));
                if (!matchedMenu) return null;
                return (
                  <div key={id} className="flex justify-between items-start text-xs border-b border-gray-50 pb-2.5">
                    <div className="max-w-[70%]">
                      <p className="font-black text-gray-700 truncate">{matchedMenu.name}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">Rp {matchedMenu.price.toLocaleString("id-ID")} x {cart[id]}</p>
                    </div>
                    <span className="font-bold text-gray-800">Rp {(matchedMenu.price * cart[id]).toLocaleString("id-ID")}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 space-y-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-bold">Subtotal Bayar:</span>
              <span className="font-black text-lg text-[#EE6425]">Rp {totalBelanja.toLocaleString("id-ID")}</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={totalBelanja === 0}
              className={`w-full py-3.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 ${
                totalBelanja > 0 
                  ? "bg-[#EE6425] text-white hover:bg-[#d5531c] active:scale-95 shadow-md shadow-orange-100" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              💳 Konfirmasi & Pesan via BeePay
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;