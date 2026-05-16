import React from "react";
import Notification from "../ui/Notification";

const NavbarAdmin = ({ currentTab, onNotifClick }) => {
  return (
    <div className="bg-white justify-between flex items-center pr-10 pl-7 py-4 shadow-sm max-md:px-5 border-b border-gray-100">
      {/* Breadcrumb Desktop */}
      <p className="max-md:hidden text-gray-500 text-sm font-medium">
        Admin &#62; <span className="font-bold text-gray-800 capitalize">{currentTab}</span>
      </p>
      
      {/* Title Mobile */}
      <h1 className="font-bold text-xl md:hidden text-orange-500 flex items-center gap-1">
        <span>🐝</span> BeeFood
      </h1>

      {/* Profil & Notif */}
      <div className="flex justify-center items-center gap-5">
        <Notification count={3} onClick={onNotifClick} />
        <div className="text-right max-md:hidden">
          <h1 className="font-bold text-sm text-gray-800">Stella Budi</h1>
          <p className="text-xs text-gray-400">Super Admin</p>
        </div>
      </div>
    </div>
  );
};

export default NavbarAdmin;