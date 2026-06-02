"use client";

import { useEffect, useState } from "react";
import { Bell, Search, HelpCircle, ChevronDown, Menu, X } from "lucide-react";

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
}

export default function Header({ isMobile, onToggleSidebar }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
  }, []);

  const meta = ROLE_META[user?.role || ""] || ROLE_META["member"];
  const initials = user?.fullname
    ? user.fullname.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="
      sticky top-0 z-30 flex items-center justify-between
      h-14 md:h-16 px-3 md:px-6 bg-white border-b border-slate-200/80
      shadow-[0_1px_8px_rgba(0,0,0,0.04)]
    ">
      {/* LEFT — Menu toggle on mobile + page title */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                       text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-sm md:text-[15px] font-bold text-slate-800 leading-none tracking-tight truncate">
            Espace Administration
          </h1>
          <div className="hidden md:flex items-center gap-1.5 mt-1.5">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide">
              Système opérationnel
            </span>
          </div>
        </div>
      </div>

      {/* CENTER — Search bar (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-sm mx-8">
        <div className={`
          relative w-full flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200
          ${searchFocused
            ? "border-blue-400 bg-white shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
            : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }
        `}>
          <Search size={14} className={`flex-shrink-0 ${searchFocused ? "text-blue-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Rechercher…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="
              w-full text-[13px] text-slate-700 placeholder:text-slate-400
              bg-transparent outline-none
            "
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200 text-[10px] font-medium text-slate-500">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* RIGHT — Actions + User */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Help (hidden on mobile) */}
        <button className="
          hidden md:flex w-9 h-9 rounded-xl items-center justify-center
          text-slate-400 hover:text-slate-600 hover:bg-slate-100
          transition-all duration-150
        ">
          <HelpCircle size={17} />
        </button>

        {/* Notifications */}
        <button className="
          relative w-9 h-9 rounded-xl flex items-center justify-center
          text-slate-400 hover:text-slate-600 hover:bg-slate-100
          transition-all duration-150
        ">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* Divider (hidden on mobile) */}
        <div className="hidden md:block w-px h-7 bg-slate-200 mx-1" />

        {/* User profile - Responsive */}
        <button className="flex items-center gap-2 md:gap-2.5 pl-0 md:pl-1 pr-2 md:pr-2 py-1.5 rounded-xl hover:bg-slate-50 transition-all duration-150 group">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] md:text-[12px] font-bold text-white flex-shrink-0 ${meta.avatarBg} shadow-sm`}>
            {initials}
          </div>

          {/* Name + role (hidden on mobile) */}
          <div className="hidden md:flex flex-col items-start">
            <span className="text-[13px] font-semibold text-slate-800 leading-none">
              {user?.fullname || "Utilisateur"}
            </span>
            <span className={`text-[11px] font-medium mt-0.5 ${meta.badgeText}`}>
              {meta.label}
            </span>
          </div>

          <ChevronDown size={13} className="hidden md:block text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
        </button>
      </div>
    </header>
  );
}