import React from "react";

const AdminDashboard = () => {
  const adminMenus = [
    { id: 1, name: "Ayam Geprek Crispy", price: "Rp 18.000", tenant: "Kantin Ayam Geprek", stock: 45, status: "Tersedia" },
    { id: 2, name: "Ice Caramel Latte", price: "Rp 22.000", tenant: "Kedai Kopi Kampus", stock: 30, status: "Tersedia" },
    { id: 3, name: "Tempe Mendoan (Isi 3)", price: "Rp 7.000", tenant: "Gorengan Renyah Kampus", stock: 0, status: "Habis" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-gray-800 font-sans">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-100 p-6 fixed h-full left-0 top-0">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🐝</span>
          <h1 className="text-xl font-black text-[#EE6425] tracking-tight">BeeFood Admin</h1>
        </div>
        <ul className="space-y-2">
          <li className="p-3.5 rounded-xl text-gray-500 hover:bg-gray-50 font-bold text-sm cursor-pointer flex items-center gap-2.5">
            🏪 Manajemen Tenant
          </li>
          <li className="p-3.5 rounded-xl bg-orange-500 text-white font-bold text-sm cursor-pointer flex items-center gap-2.5 shadow-md shadow-orange-100">
            🍔 Manajemen Menu
          </li>
        </ul>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 ml-64 flex flex-col">
        
        {/* NAVBAR ATAS (Perbaikan teks kepotong) */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center w-full sticky top-0 z-10">
          <div className="text-xs font-bold text-gray-400">Admin &gt; <span className="text-gray-700">Menu Makanan</span></div>
          <div className="flex items-center gap-3 max-w-xs">
            <button className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl relative text-gray-500">🔔</button>
            <div className="text-right truncate">
              {/* truncate & max-w mencegah teks nabrak/hilang */}
              <p className="text-sm font-black text-gray-800 truncate max-w-[150px]">Stella Budi Sugianto</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>

        {/* AREA KATALOG */}
        <div className="p-8 max-w-5xl w-full space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Katalog Menu BeeFood</h2>
            <p className="text-xs text-gray-400 mt-1">Kelola dan pantau seluruh produk aktif di kantin</p>
          </div>

          {/* GRID KARTU KINI LEBIH RAPI & MATANG */}
          <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-5">
            {adminMenus.map((menu) => (
              <div key={menu.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  {/* Header info kartu */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className="bg-orange-50 text-[#EE6425] text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-orange-100 truncate max-w-[120px]">
                      {menu.tenant}
                    </span>
                    {menu.status === "Tersedia" ? (
                      <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Stok: {menu.stock}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Habis</span>
                    )}
                  </div>

                  {/* Info Menu (Rata Kiri jauh lebih profesional dibaca) */}
                  <h4 className="font-bold text-gray-800 text-base leading-snug">{menu.name}</h4>
                  <p className="text-gray-900 font-black text-lg mt-2">{menu.price}</p>
                </div>

                {/* Button Aksi */}
                <div className="mt-5 pt-3 border-t border-gray-50">
                  <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition border border-gray-200/60">
                    ⚙️ Edit Detail Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;