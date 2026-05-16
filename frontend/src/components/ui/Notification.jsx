import React from "react";

const Notification = ({ count, onClick }) => (
  <div onClick={onClick} className="relative p-2.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100 transition shadow-sm">
    <span className="text-xl">🔔</span>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
        {count}
      </span>
    )}
  </div>
);

export default Notification;