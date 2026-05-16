import React, { useState } from "react";
import SidebarAdmin from "../components/admin/SidebarAdmin";
import NavbarAdmin from "../components/admin/NavbarAdmin";
import ModalNotification from "../components/ui/ModalNotification";

const MenuDashboard = () => {
  const [notifOpen, setNotifOpen] = useState(false);

  // Data Dummy Makanan Global BeeFood
  const foodMenus = [
    { id: 1, name: "Ayam Geprek Crispy", tenant: "Kantin Ayam Geprek", price: "Rp 18.000", stock: 45 },
    { id: 2, name: "Ice Caramel Latte", tenant: "Kedai Kopi Kampus", price: "Rp 22.000", stock: 30 },
    { id: 3, name: "Tempe Mendoan (Isi 3)", tenant: "Gorengan Renyah Kampus", price: "Rp 7.000", stock: 0 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      <SidebarAdmin />

      <div className="flex-1 md:pl-64 w-full transition-all duration-300">
        <NavbarAdmin currentTab="Menu Makanan" onNotifClick={() => setNotifOpen(true)} />

        <div className="pr-10 pl-7 pt-6 pb-10 max-md:px-5 w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Katalog Menu BeeFood</h1>
              <p className="text-sm text-gray-400 mt-1">Total produk aktif di kantin</p>
            </div>
          </div>

          {/* Grid Menu */}
          <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
            {foodMenus.map((menu) => (
              <div key={menu.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-lg font-bold mb-3 inline-block">
                      {menu.tenant}
                    </span>
                    <span className={`text-xs font-bold ${menu.stock > 0 ? "text-green-500" : "text-red-500"}`}>
                      {menu.stock > 0 ? `Stok: ${menu.stock}` : "Habis"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{menu.name}</h3>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xl font-black text-gray-900">{menu.price}</span>
                  <button className="text-xs bg-gray-100 hover:bg-orange-500 hover:text-white font-bold px-3 py-2 rounded-xl transition text-gray-600">
                    Edit Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalNotification visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
};

export default MenuDashboard;