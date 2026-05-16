import React from "react";

const ModalNotification = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end transition-opacity">
      <div className="bg-white w-96 max-sm:w-full h-full p-6 shadow-2xl flex flex-col animate-slide-left">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>🔔</span> Notifikasi Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl p-1 rounded-lg hover:bg-gray-50">✕</button>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto">
          <div className="p-3.5 bg-orange-50 border-l-4 border-orange-500 rounded-xl">
            <p className="text-sm font-bold text-gray-800">Registrasi Tenant Baru</p>
            <p className="text-xs text-gray-500 mt-1">Kantin Nasi Padang berkasnya telah dikirim.</p>
          </div>
          <div className="p-3.5 bg-blue-50 border-l-4 border-blue-500 rounded-xl">
            <p className="text-sm font-bold text-gray-800">Sistem Update</p>
            <p className="text-xs text-gray-500 mt-1">Sistem BeeFood diperbarui ke versi stabil.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalNotification;