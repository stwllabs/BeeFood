import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Mock Database Terintegrasi dengan Foto & Nama Restoran
const dummyTenants = [
  { id: 1, name: 'Dapur Binusian', location: 'Kantin Lt. 1' },
  { id: 2, name: 'HIMTI Coffee & Bento', location: 'Kantin Lt. 2' }
];

const dummyMenus = [
  { id: 1, name: 'Nasi Goreng Spesial', price: 15000, estimatedTime: 10, tenantId: 1, tenantName: 'Dapur Binusian', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Ayam Geprek Mozzarella', price: 22000, estimatedTime: 15, tenantId: 1, tenantName: 'Dapur Binusian', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Kopi Susu Gula Aren', price: 12000, estimatedTime: 5, tenantId: 2, tenantName: 'HIMTI Coffee & Bento', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Chicken Katsu Don', price: 25000, estimatedTime: 12, tenantId: 2, tenantName: 'HIMTI Coffee & Bento', img: 'https://images.unsplash.com/photo-1591814468924-cafb1d223297?auto=format&fit=crop&w=400&q=80' }
];

export default function DashboardStudent({ user, setUser }) {
  const navigate = useNavigate();
  const [selectedTenant, setSelectedTenant] = useState(dummyTenants[0]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('BEEPAY');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });
    return () => socket.off('orderUpdated');
  }, []);

  const updateQty = (menuId, delta) => {
    setCart(prev => {
      const item = prev.find(i => i.id === menuId);
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== menuId);
      return prev.map(i => i.id === menuId ? { ...i, qty: newQty } : i);
    });
  };

  const addToCart = (menuItem) => {
    setCart(prev => {
      const item = prev.find(i => i.id === menuItem.id);
      if (item) return prev.map(i => i.id === menuItem.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...menuItem, qty: 1 }];
    });
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'BEEPAY' && user.balance < totalCartPrice) {
      alert('Saldo BeePay tidak cukup!');
      return;
    }

    const newOrder = {
      id: Math.floor(Math.random() * 9000) + 1000,
      status: 'PREPARING', // Tahapan 1: Sedang Disiapkan
      totalPrice: totalCartPrice,
      payment: paymentMethod,
      items: [...cart]
    };

    if (paymentMethod === 'BEEPAY') {
      setUser(prev => ({ ...prev, balance: prev.balance - totalCartPrice }));
    }

    setOrders(prev => [newOrder, ...prev]);
    // Kirim sinyal real-time ke tenant
    socket.emit('newOrderCreated', newOrder);
    setCart([]);
    alert(`Pembayaran sukses menggunakan ${paymentMethod}! Pre-order dikirim.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 text-left font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
        <span className="text-2xl font-black text-orange-500">BeeFood</span>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold">{user.name}</p>
            <p className="text-xs font-black text-emerald-600">BeePay: Rp {user.balance.toLocaleString('id-ID')}</p>
          </div>
          <button onClick={() => { setUser(null); navigate('/'); }} className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-xl">Keluar</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: PILIH RESTORAN */}
          <div>
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Pilih Restoran Kantin</h2>
            <div className="grid grid-cols-2 gap-4">
              {dummyTenants.map(t => (
                <div key={t.id} onClick={() => setSelectedTenant(t)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedTenant.id === t.id ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white border-gray-200'}`}>
                  <h3 className="font-bold text-base">{t.name}</h3>
                  <p className="text-xs opacity-80">📍 {t.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: DAFTAR MENU BERGAMBAR */}
          <div>
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Menu Terbuka di {selectedTenant.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dummyMenus.filter(m => m.tenantId === selectedTenant.id).map(m => (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between">
                  <img src={m.img} alt={m.name} className="w-full h-40 object-cover" />
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{m.tenantName}</span>
                      <h3 className="font-extrabold text-base mt-1">{m.name}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-black text-orange-500">Rp {m.price.toLocaleString('id-ID')}</span>
                      <button onClick={() => addToCart(m)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Tambah</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: KERANJANG QUANTITY & STEPPER REAL-TIME TRACKING */}
        <div className="space-y-6">
          {/* KERANJANG BELANJA */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h3 className="font-black text-base uppercase tracking-wider mb-3">Keranjang Pre-order</h3>
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Keranjang belanja kosong.</p>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-gray-100">
                  {cart.map(item => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-orange-500 font-extrabold">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 rounded-lg">-</button>
                        <span className="w-4 text-center font-bold text-xs">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 rounded-lg">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PILIHAN METODE PEMBAYARAN */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Metode Pembayaran</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700">
                    <option value="BEEPAY">💸 BeePay (Saldo Internal)</option>
                    <option value="QRIS">📸 QRIS (Gopay/OVO/Dana)</option>
                    <option value="GOPAY">📱 GoPay</option>
                  </select>
                </div>

                <div className="flex justify-between font-black text-sm pt-2">
                  <span>Total:</span>
                  <span className="text-orange-500">Rp {totalCartPrice.toLocaleString('id-ID')}</span>
                </div>
                <button onClick={handleCheckout} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-3 rounded-xl text-center text-xs">Bayar Sekarang</button>
              </div>
            )}
          </div>

          {/* STEPPER LIVE TRACKING REAL-TIME */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h3 className="font-black text-base uppercase tracking-wider mb-4">Live Order Status Steps</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Belum ada pesanan aktif.</p>
            ) : (
              <div className="space-y-6">
                {orders.map(o => (
                  <div key={o.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-gray-500">ORDER #{o.id}</span>
                      <span className="px-2 py-0.5 bg-gray-200 rounded font-bold text-[10px]">{o.payment}</span>
                    </div>

                    {/* STEPPER VISUAL */}
                    <div className="flex items-center justify-between relative pt-2">
                      <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-0"></div>
                      
                      {/* Step 1 */}
                      <div className="z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${o.status === 'PREPARING' || o.status === 'READY' || o.status === 'DONE' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
                        <span className="text-[9px] font-bold mt-1 text-gray-500">Disiapkan</span>
                      </div>
                      {/* Step 2 */}
                      <div className="z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${o.status === 'READY' || o.status === 'DONE' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
                        <span className="text-[9px] font-bold mt-1 text-gray-500">Siap Ambil</span>
                      </div>
                      {/* Step 3 */}
                      <div className="z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${o.status === 'DONE' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
                        <span className="text-[9px] font-bold mt-1 text-gray-500">Selesai</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}