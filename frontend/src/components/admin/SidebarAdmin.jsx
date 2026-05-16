import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "tenant", name: "Manajemen Tenant", path: "/admin/tenant", icon: "🏪" },
    { id: "menu", name: "Manajemen Menu", path: "/admin/menu", icon: "🍔" },
  ];

  return (
    <div className="w-64 max-md:hidden bg-white border-r border-gray-200 min-h-screen p-5 fixed left-0 top-0 z-20 shadow-sm">
      <div className="text-2xl font-black text-orange-500 mb-10 tracking-wider flex items-center gap-2">
        <span>🐝</span> BeeFood Admin
      </div>
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer font-semibold text-sm transition-all ${
                isActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-orange-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SidebarAdmin;