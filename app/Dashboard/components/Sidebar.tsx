"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, UserPlus, Briefcase, Settings,
  LogOut, ChevronLeft, ChevronRight, ShieldCheck, PlusCircle,
  Building2, PhoneCall, Megaphone, CheckCircle, Headphones,
  Building, Search,
} from "lucide-react";

enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN_COMPANY = "admin_company",
  MANAGER = "manager",
  PROJECT_MANAGER = "project_manager",
  CALL_CENTER_MANAGER = "call_center_manager",
  SALES_MANAGER = "sales_manager",
  MARKETING_MANAGER = "marketing_manager",
  QUALITY_MANAGER = "quality_manager",
  HR_MANAGER = "hr_manager",
  AGENT_TELEPRO = "agent_telepro",
  COMMERCIAL = "commercial",
  MARKETING_AGENT = "marketing_agent",
  QUALITE_AGENT = "qualite_agent",
  TECH_SUPPORT = "tech_support",
  MEMBER = "member",
}

const CompanySearchIcon = () => (
  <span className="relative inline-flex w-[17px] h-[17px]">
    <Building className="w-[17px] h-[17px]" />
    <Search className="w-2 h-2 absolute -right-0.5 -bottom-0.5 bg-white rounded-full p-px text-blue-600" />
  </span>
);

const MENU_BY_ROLE: Record<UserRole, any[]> = {
  [UserRole.SUPER_ADMIN]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users, section: "Gestion" },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
    { href: "/Dashboard/companies", label: "Sociétés", icon: Building2 },
    { href: "/Dashboard/companies/create", label: "Ajouter société", icon: PlusCircle },
    { href: "/Dashboard/projects", label: "Projets", icon: Briefcase },
    { href: "/Dashboard/lead", label: "Lead List", icon: Users, section: "Commercial" },
    { href: "/Dashboard/commerciale", label: "Chercher Company", icon: CompanySearchIcon },
  ],
  [UserRole.ADMIN_COMPANY]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users, section: "Gestion" },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
    { href: "/Dashboard/projects", label: "Projets", icon: Briefcase },
    { href: "/Dashboard/lead", label: "Lead List", icon: Users, section: "Commercial" },
    { href: "/Dashboard/commerciale", label: "Chercher Company", icon: CompanySearchIcon },
  ],
  [UserRole.MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
    { href: "/Dashboard/project/create", label: "Créer Projet", icon: PlusCircle, section: "Projets" },
    { href: "/Dashboard/project", label: "Liste des Projets", icon: Briefcase },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users, section: "Équipe" },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
  ],
  [UserRole.PROJECT_MANAGER]: [
    { href: "/Dashboard", label: "Mes Projets", icon: Briefcase, section: "Projets" },
    { href: "/Dashboard/project", label: "Liste des Projets", icon: Briefcase },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users, section: "Équipe" },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
  ],
  [UserRole.CALL_CENTER_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
    { href: "/Dashboard/agents", label: "Agents", icon: Users, section: "Centre d'Appel" },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
  ],
  [UserRole.SALES_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
  ],
  [UserRole.MARKETING_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
    { href: "/Dashboard/marketing", label: "Marketing Hub", icon: Megaphone },
  ],
  [UserRole.QUALITY_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Principal" },
  ],
  [UserRole.HR_MANAGER]: [
    { href: "/Dashboard/RH/postslist", label: "Post List", icon: LayoutDashboard, section: "RH" },
    { href: "/Dashboard/RH/postslist/create", label: "Ajouter Post", icon: UserPlus },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
  ],
  [UserRole.AGENT_TELEPRO]: [
    { href: "/Dashboard", label: "Mes Appels", icon: PhoneCall, section: "Appels" },
  ],
  [UserRole.COMMERCIAL]: [
    { href: "/Dashboard", label: "Opportunités", icon: Briefcase, section: "Commercial" },
    { href: "/Dashboard/commerciale", label: "Chercher Company", icon: CompanySearchIcon },
    { href: "/Dashboard/commerciale/recomandationindistry", label: "Recommandations", icon: CompanySearchIcon },
  ],
  [UserRole.MARKETING_AGENT]: [
    { href: "/Dashboard", label: "Campagnes", icon: Megaphone, section: "Marketing" },
  ],
  [UserRole.QUALITE_AGENT]: [
    { href: "/Dashboard", label: "Contrôles Qualité", icon: CheckCircle, section: "Qualité" },
  ],
  [UserRole.TECH_SUPPORT]: [
    { href: "/Dashboard", label: "Tickets", icon: Headphones, section: "Support" },
  ],
  [UserRole.MEMBER]: [
    { href: "/Dashboard", label: "Mon Profil", icon: Settings, section: "Profil" },
    { href: "/Dashboard/project/memberproject", label: "Liste des Projets", icon: Briefcase },
  ],
};

const ROLE_META: Record<string, { avatarBg: string; avatarText: string; badgeBg: string; badgeText: string; dot: string; label: string }> = {
  super_admin:         { avatarBg: "bg-violet-600", avatarText: "text-white", badgeBg: "bg-violet-50",  badgeText: "text-violet-700", dot: "bg-violet-500", label: "Super Admin" },
  admin_company:       { avatarBg: "bg-blue-600",   avatarText: "text-white", badgeBg: "bg-blue-50",    badgeText: "text-blue-700",   dot: "bg-blue-500",   label: "Admin Société" },
  manager:             { avatarBg: "bg-emerald-600",avatarText: "text-white", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700",dot: "bg-emerald-500",label: "Manager" },
  project_manager:     { avatarBg: "bg-amber-500",  avatarText: "text-white", badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  label: "Chef de Projet" },
  call_center_manager: { avatarBg: "bg-cyan-600",   avatarText: "text-white", badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   label: "Mgr Centre Appel" },
  sales_manager:       { avatarBg: "bg-rose-600",   avatarText: "text-white", badgeBg: "bg-rose-50",    badgeText: "text-rose-700",   dot: "bg-rose-500",   label: "Mgr Commercial" },
  marketing_manager:   { avatarBg: "bg-orange-500", avatarText: "text-white", badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", label: "Mgr Marketing" },
  quality_manager:     { avatarBg: "bg-green-600",  avatarText: "text-white", badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  label: "Mgr Qualité" },
  hr_manager:          { avatarBg: "bg-purple-600", avatarText: "text-white", badgeBg: "bg-purple-50",  badgeText: "text-purple-700", dot: "bg-purple-500", label: "Mgr RH" },
  agent_telepro:       { avatarBg: "bg-cyan-500",   avatarText: "text-white", badgeBg: "bg-cyan-50",    badgeText: "text-cyan-700",   dot: "bg-cyan-500",   label: "Agent Télépro" },
  commercial:          { avatarBg: "bg-amber-500",  avatarText: "text-white", badgeBg: "bg-amber-50",   badgeText: "text-amber-700",  dot: "bg-amber-500",  label: "Commercial" },
  marketing_agent:     { avatarBg: "bg-orange-500", avatarText: "text-white", badgeBg: "bg-orange-50",  badgeText: "text-orange-700", dot: "bg-orange-500", label: "Agent Marketing" },
  qualite_agent:       { avatarBg: "bg-green-500",  avatarText: "text-white", badgeBg: "bg-green-50",   badgeText: "text-green-700",  dot: "bg-green-500",  label: "Agent Qualité" },
  tech_support:        { avatarBg: "bg-indigo-600", avatarText: "text-white", badgeBg: "bg-indigo-50",  badgeText: "text-indigo-700", dot: "bg-indigo-500", label: "Support Tech" },
  member:              { avatarBg: "bg-slate-500",  avatarText: "text-white", badgeBg: "bg-slate-100",  badgeText: "text-slate-600",  dot: "bg-slate-400",  label: "Membre" },
};

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (!currentUser?.role) return null;

  const menu = MENU_BY_ROLE[currentUser.role as UserRole] || [];
  const meta = ROLE_META[currentUser.role] || ROLE_META["member"];
  const initials = currentUser?.fullname
    ? currentUser.fullname.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Group by section
  const grouped: { section: string | null; items: any[] }[] = [];
  let curSection: string | null = null;
  let curItems: any[] = [];
  menu.forEach((item) => {
    if (item.section && item.section !== curSection) {
      if (curItems.length) grouped.push({ section: curSection, items: curItems });
      curSection = item.section;
      curItems = [item];
    } else {
      curItems.push(item);
    }
  });
  if (curItems.length) grouped.push({ section: curSection, items: curItems });

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-white border-r border-slate-200/80
        shadow-[1px_0_12px_rgba(0,0,0,0.04)] flex-shrink-0
        transition-[width] duration-300 ease-in-out
        ${open ? "w-64" : "w-[68px]"}
      `}
    >
      {/* Toggle btn */}
      <button
        onClick={() => setOpen(!open)}
        className="
          absolute -right-3.5 top-8 z-50
          w-7 h-7 rounded-full bg-white border border-slate-200
          flex items-center justify-center shadow-sm
          text-slate-400 hover:text-blue-600 hover:border-blue-300
          transition-all duration-200
        "
      >
        {open ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {/* Brand Header */}
      <div className={`flex items-center gap-3 py-5 border-b border-slate-100 ${open ? "px-5" : "px-[18px] justify-center"}`}>
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200/60">
          <ShieldCheck size={17} className="text-white" strokeWidth={2.2} />
        </div>
        {open && (
          <div>
            <p className="text-[13px] font-bold text-slate-800 tracking-tight leading-none">Admin Panel</p>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 [&::-webkit-scrollbar]:w-0">
        {grouped.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {/* Section label */}
            {group.section && open && (
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 px-2 mb-1.5">
                {group.section}
              </p>
            )}
            {group.section && !open && <div className="h-2" />}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative group flex items-center rounded-xl
                      text-[13px] font-medium transition-all duration-150
                      ${open ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"}
                      ${isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200/50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }
                    `}
                  >
                    <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"} transition-colors`}>
                      <Icon size={17} />
                    </span>
                    {open && (
                      <>
                        <span className="truncate leading-none flex-1">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — user + logout */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        <div className={`flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ${!open && "justify-center"}`}>
          <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${meta.avatarBg} ${meta.avatarText}`}>
            {initials}
          </div>
          {open && (
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-slate-800 truncate leading-none">
                {currentUser.fullname || "Utilisateur"}
              </p>
              <p className={`text-[11px] mt-0.5 truncate font-medium ${meta.badgeText}`}>{meta.label}</p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={`
            w-full flex items-center rounded-xl px-3 py-2.5
            text-[13px] font-medium text-slate-400
            hover:bg-red-50 hover:text-red-600 transition-all duration-150
            ${open ? "gap-3" : "justify-center"}
          `}
        >
          <LogOut size={16} />
          {open && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}