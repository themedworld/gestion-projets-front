"use client";

import { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";

export default function CompanyAdminHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <header className="h-16 px-8 flex items-center justify-between
      bg-white border-b border-slate-200 sticky top-0 z-30"
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <p className="text-sm text-slate-500">
          Société :
          <span className="text-slate-900 font-medium ml-1">
            {user?.company?.name ?? "—"}
          </span>
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-blue-600">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">
              {user?.fullname ?? "Admin"}
            </p>
            <p className="text-xs text-slate-400">
              Administrateur société
            </p>
          </div>

          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white
            flex items-center justify-center font-semibold">
            {user?.fullname?.[0]?.toUpperCase() || <User size={16} />}
          </div>
        </div>
      </div>
    </header>
  );
}
