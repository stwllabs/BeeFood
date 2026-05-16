import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("orders");

  // Simulasi Antrean Masuk dari Mahasiswa
  const [orders, setOrders] = useState([
    { id: "ORD-8042", user: "Evan (Student)", menu: "Ayam Geprek Crispy", qty: 1, method: "BeePay", status: "Cooking" },
    { id: "ORD-1299", user: "Herlinda (Student)", menu: "Ice Caramel Latte", qty: 2, method: "BeePay", status: "Pending" },
  ]);

  // Katalog Penjual Dilengkapi Gambar Pendukung (FR 3)
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

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* Sidebar Kiri */}
      <div className="w-64 max-md:hidden bg-white border-r border-gray-200 h-screen p-5 fixed left-0 top-0 z-20">
        <div className="text-2xl font-black text-orange-500 mb-10 tracking-wider">🐝 BeeFood</div>
        <ul className="space-y-2">
          <li
            onClick={() => setCurrentTab("orders")}
            className={`p-3.5 rounded-xl cursor-pointer font-bold text-sm flex items-center gap-2 transition ${
              currentTab === "orders" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            📋 Antrean Pesanan Real-time
          </li>
          <li
            onClick={() => setCurrentTab("stock")}
            className={`p-3.5 rounded-xl cursor-pointer font-bold text-sm flex items-center gap-2 transition ${
              currentTab === "stock" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🍔 Kontrol Menu & Stok
          </li>
        </ul>
        <button onClick={() => navigate("/")} className="absolute bottom-5 left-5 text-xs font-bold text-gray-400 hover:text-red-500">
          Logout Dasbor →
        </button>
      </div>

      {/* Konten Utama Kanan (Margin-Left Terproteksi) */}
      <div className="flex-1 md:ml-64 w-full flex flex-col">
        
        {/* Header Dashboard */}
        <div className="bg-white flex justify-between items-center px-8 py-4 border-b border-gray-100 w-full">
          <div>
            <p className="text-xs text-gray-400 font-medium">Panel Operasional Kantin</p>
            <h2 className="text-lg font-bold text-gray-800">Stella Budi Sugianto</h2>
          </div>
          <span className="bg-green-50 text-green-600 font-bold px-3 py-1.5 rounded-xl text-xs border border-green-100">
            🟢 Toko Buka • Ayam Geprek SASC
          </span>
        </div>

        {/* Dynamic Display */}
        <div className="p-8 max-sm:p-5 w-full max-w-5xl">
          {currentTab === "orders" ? (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Daftar Pre-Order Masuk</h3>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase p-4">
                      <th className="p-4">ID</th>
                      <th className="p-4">Pemesan</th>
                      <th className="p-4">Menu Terpilih</th>
                      <th className="p-4">Metode Kasir</th>
                      <th className="p-4">Tahapan</th>
                      <th className="p-4 text-center">Aksi Operasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-bold text-orange-500">{o.id}</td>
                        <td className="p-4 font-semibold">{o.user}</td>
                        <td className="p-4 text-gray-600">{o.menu} <span className="text-gray-400 font-bold">x{o.qty}</span></td>
                        <td className="p-4"><span className="bg-orange-50 text-orange-600 font-bold text-[10px] px-2 py-0.5 rounded border border-orange-100">💳 {o.method}</span></td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            o.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {o.status === "Pending" ? "⏳ Menunggu" : "🍳 Dimasak"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => changeStatus(o.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition"
                          >
                            {o.status === "Pending" ? "Mulai Masak" : "Set Siap Ambil"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Manajemen Display Katalog</h3>
              <div className="grid grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1 gap-6">
                {stockMenu.map((s) => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="h-32 w-full bg-gray-100">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{s.name}</h4>
                        <p className="text-gray-900 font-black text-sm mt-1">{s.price}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className={`text-xs font-bold ${s.isAvailable ? "text-green-500" : "text-red-500"}`}>
                          {s.isAvailable ? "● Aktif Dijual" : "● Dihentikan"}
                        </span>
                        <button
                          onClick={() => toggleStock(s.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                            s.isAvailable ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {s.isAvailable ? "Set Habis" : "Set Jual"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TenantDashboard;