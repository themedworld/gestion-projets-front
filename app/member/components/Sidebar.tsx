"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

export default function MemberSidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const navItem = (
    href: string,
    label: string,
    Icon: any
  ) => (
    <Link
      href={href}
      className={`flex items-center gap-4 px-4 py-3 rounded-lg transition
        ${pathname === href
          ? "bg-blue-600 text-white shadow"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
    >
      <Icon size={20} />
      {open && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );

  return (
    <aside
      className={`relative h-screen bg-slate-900 border-r border-slate-800 transition-all
        ${open ? "w-64" : "w-20"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-20 bg-blue-600 text-white rounded-full p-1 shadow"
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <Building2 size={18} />
        </div>
        {open && (
          <span className="font-semibold text-white text-lg">
            Company Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="p-4 space-y-2">
        {navItem("/admin", "Dashboard", LayoutDashboard)}
        {navItem("/admin/users", "Utilisateurs", Users)}
        {navItem("/admin/projects", "Projets", Briefcase)}
        {navItem("/admin/settings", "Paramètres", Settings)}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg
            text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut size={18} />
          {open && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
