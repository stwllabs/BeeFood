import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Mock Data Awal Menu Tenant (Biar sinkron dengan dashboard mahasiswa)
const initialMenus = [
  { id: 1, name: 'Nasi Goreng Spesial', price: 15000, estimatedTime: 10, tenantId: 1, tenantName: 'Dapur Binusian', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80', isAvailable: true },
  { id: 2, name: 'Ayam Geprek Mozzarella', price: 22000, estimatedTime: 15, tenantId: 1, tenantName: 'Dapur Binusian', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80', isAvailable: true }
];

export default function DashboardTenant({ user, setUser }) {
  const navigate = useNavigate();
  const [tenantOrders, setTenantOrders] = useState([]);
  const [menus, setMenus] = useState(initialMenus);

  // Form states untuk Tambah Menu Baru
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuTime, setNewMenuTime] = useState('');

  useEffect(() => {
    // Jalur real-time order masuk
    socket.on('orderCreated', (newOrder) => {
      setTenantOrders(prev => [newOrder, ...prev]);
    });
    return () => socket.off('orderCreated');
  }, []);

  // FITUR 1: UPDATE TAHAPAN STATUS PESANAN (REAL-TIME)
  const changeStatus = (orderId, nextStatus) => {
    setTenantOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o);
      const targets = updated.find(o => o.id === orderId);
      socket.emit('updateOrderStatus', targets);
      return updated;
    });
  };

  // FITUR 2: TOGGLE STOK KATALOG (TERSEDIA / HABIS)
  const toggleAvailability = (menuId) => {
    setMenus(prevMenus =>
      prevMenus.map(m => {
        if (m.id === menuId) {
          const updatedMenu = { ...m, isAvailable: !m.isAvailable };
          // Opsional: Kirim sinyal socket ke mahasiswa jika ingin update stok real-time tanpa refresh
          socket.emit('menuStockUpdated', updatedMenu);
          return updatedMenu;
        }
        return m;
      })
    );
  };

  // FITUR 3: TAMBAH KATALOG MENU BARU
  const handleAddMenu = (e) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice || !newMenuTime) return;

    const newMenu = {
      id: Date.now(),
      name: newMenuName,
      price: parseInt(newMenuPrice),
      estimatedTime: parseInt(newMenuTime),
      tenantId: user.tenantId || 1,
      tenantName: user.tenantName,
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80', // Default placeholder food image
      isAvailable: true
    };

    setMenus(prev => [...prev, newMenu]);
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuTime('');
    alert('✅ Menu baru berhasil dipublish ke katalog kantin!');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 text-left font-sans">
      {/* NAVBAR */}
      <header className="bg-gray-900 text-white px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-orange-500">BeeFood Tenant Console</span>
          <span className="text-xs bg-gray-700 px-2.5 py-0.5 rounded-full font-bold">{user.tenantName}</span>
        </div>
        <button onClick={() => { setUser(null); navigate('/'); }} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl">Keluar</button>
      </header>

      {/* BODY UTAMA */}
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (2 SPAN): KELOLA KATALOG & STOK */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FORM TAMBAH MENU */}
          <section className="bg-white p-6 rounded-3xl border border-gray-200 text-left shadow-xs">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-wider mb-4">Tambah Menu Makanan Baru</h2>
            <form onSubmit={handleAddMenu} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Item</label>
                <input type="text" placeholder="Contoh: Es Teh Lemon" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Jual (Rp)</label>
                <input type="number" placeholder="Harga" value={newMenuPrice} onChange={(e) => setNewMenuPrice(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Waktu Masak (Menit)</label>
                <input type="number" placeholder="Menit" value={newMenuTime} onChange={(e) => setNewMenuTime(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none" required />
              </div>
              <button type="submit" className="md:col-span-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold p-3 rounded-xl transition-colors mt-2 text-center">Publish Menu ke Etalase</button>
            </form>
          </section>

          {/* DAFTAR KATALOG AKTIF + PENGELOLAAN STOK */}
          <section className="space-y-4">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-wider">Kelola Etalase & Status Stok</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menus.map((m) => (
                <div key={m.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between transition-all ${!m.isAvailable && 'opacity-60 bg-gray-100'}`}>
                  <div className="flex p-4 gap-4 items-center">
                    <img src={m.img} alt={m.name} className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-gray-900 truncate">{m.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${m.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {m.isAvailable ? 'READY' : 'EMPTY'}
                        </span>
                      </div>
                      <p className="text-xs text-orange-500 font-black mt-1">Rp {m.price.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">⏱ Waktu Masak: {m.estimatedTime} mnt</p>
                    </div>
                  </div>

                  {/* ACTION CONTROLLER STOK */}
                  <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold">Ubah Status Menu:</span>
                    <button 
                      onClick={() => toggleAvailability(m.id)} 
                      className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors ${m.isAvailable ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                      {m.isAvailable ? '⚠️ Set Jadi Habis' : '✅ Aktifkan Kembali'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* KOLOM KANAN (1 SPAN): ANTREAN LIVE ORDER TRACKING STEPS */}
        <div className="space-y-4">
          <h2 className="text-base font-black uppercase tracking-wider">Antrean Pesanan Live</h2>
          {tenantOrders.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center text-xs text-gray-400 font-bold">
              Belum ada pesanan masuk.
            </div>
          ) : (
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {tenantOrders.map(o => (
                <div key={o.id} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-xs border-b border-gray-50 pb-2">
                    <span className="font-black text-gray-700">ORDER ID #{o.id}</span>
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] tracking-wide ${o.status === 'PREPARING' ? 'bg-orange-100 text-orange-800' : o.status === 'READY' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{o.status}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 font-medium">
                    {o.items.map((it, idx) => (
                      <p key={idx}>• {it.name} ({it.qty}x)</p>
                    ))}
                  </div>

                  <p className="text-xs font-black text-gray-900 pt-1">Total Tunai: Rp {o.totalPrice.toLocaleString('id-ID')}</p>

                  {/* KONTROL STATUS TAHAPAN MASAKAN */}
                  <div className="pt-2">
                    {o.status === 'PREPARING' && (
                      <button onClick={() => changeStatus(o.id, 'READY')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2.5 rounded-xl transition-colors text-center">🔔 Nyatakan Siap Diambil</button>
                    )}
                    {o.status === 'READY' && (
                      <button onClick={() => changeStatus(o.id, 'DONE')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-2.5 rounded-xl transition-colors text-center">✓ Selesai Diambil</button>
                    )}
                    {o.status === 'DONE' && (
                      <div className="text-center text-[10px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl">✓ Pesanan Selesai Dinikmati</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}