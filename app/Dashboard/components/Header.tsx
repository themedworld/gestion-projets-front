"use client";

import { useEffect, useState } from "react";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";

type User = {
  fullname: string;
  role: string;
};

const ROLE_META: Record<string, { badgeBg: string; badgeText: string; dot: string; avatarBg: string; label: string }> = {
  super_admin:         { badgeBg: "bg-violet-50",  badgeText: "text-violet-700", dot: "bg-violet-500", avatarBg: "bg-violet-600", label: "Super Admin" },
  admin_company:       { badgeBg: "bg-blue-50",    badgeText: "text-blue-700",   dot: "bg-blue-500",   avatarBg: "bg-blue-600",   label: "Admin Société" },
  manager:             { badgeBg: "bg-emerald-50", badgeText: "text-emerald-700",dot: "bg-emerald-500",avatarBg: "bg-emerald-600",label: "Manager" },
  project_manager:     { badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  avatarBg: "bg-amber-500",  label: "Chef de Projet" },
  call_center_manager: { badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   avatarBg: "bg-cyan-600",   label: "Mgr Centre Appel" },
  sales_manager:       { badgeBg: "bg-rose-50",    badgeText: "text-rose-700",   dot: "bg-rose-500",   avatarBg: "bg-rose-600",   label: "Mgr Commercial" },
  marketing_manager:   { badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", avatarBg: "bg-orange-500", label: "Mgr Marketing" },
  quality_manager:     { badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  avatarBg: "bg-green-600",  label: "Mgr Qualité" },
  hr_manager:          { badgeBg: "bg-purple-50",  badgeText: "text-purple-700", dot: "bg-purple-500", avatarBg: "bg-purple-600", label: "Mgr RH" },
  agent_telepro:       { badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   avatarBg: "bg-cyan-500",   label: "Agent Télépro" },
  commercial:          { badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  avatarBg: "bg-amber-500",  label: "Commercial" },
  marketing_agent:     { badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", avatarBg: "bg-orange-500", label: "Agent Marketing" },
  qualite_agent:       { badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  avatarBg: "bg-green-500",  label: "Agent Qualité" },
  tech_support:        { badgeBg: "bg-indigo-50",  badgeText: "text-indigo-700", dot: "bg-indigo-500", avatarBg: "bg-indigo-600", label: "Support Tech" },
  member:              { badgeBg: "bg-slate-100",  badgeText: "text-slate-600",  dot: "bg-slate-400",  avatarBg: "bg-slate-500",  label: "Membre" },
};

interface HeaderProps {
  isMobile: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ isMobile, onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const meta = ROLE_META[user?.role || ""] || ROLE_META["member"];
  const initials = user?.fullname
    ? user.fullname.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="
      sticky top-0 z-30 flex items-center justify-between
      h-16 md:h-16 px-4 md:px-6 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200/80
      shadow-[0_1px_8px_rgba(0,0,0,0.04)]
    ">
      {/* LEFT — Menu toggle + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                       text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            title={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold text-slate-800 leading-none tracking-tight truncate">
            Espace Administration
          </h1>
          <div className="flex items-center gap-1.5 mt-2 hidden sm:flex">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide">
              Système opérationnel
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — User Menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 pr-2 md:pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-150 group"
          title="Menu utilisateur"
        >
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${meta.avatarBg} shadow-sm`}>
            {initials}
          </div>

          {/* Name + role (hidden on mobile) */}
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[13px] font-semibold text-slate-800 leading-none">
              {user?.fullname || "Utilisateur"}
            </span>
            <span className={`text-[11px] font-medium mt-1 ${meta.badgeText}`}>
              {meta.label}
            </span>
          </div>

          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors ml-1" />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[12px] font-bold text-white ${meta.avatarBg}`}>
                {initials}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  {user?.fullname || "Utilisateur"}
                </p>
                <p className={`text-[12px] font-medium mt-0.5 ${meta.badgeText}`}>
                  {meta.label}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}

        {/* Backdrop to close menu */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
}