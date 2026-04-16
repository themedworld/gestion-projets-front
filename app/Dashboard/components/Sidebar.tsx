"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Building2,
  PhoneCall,
  Megaphone,
  CheckCircle,
  Headphones,
  Building,
  Search
} from "lucide-react";

/* ================== ROLES ================== */
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

/* ================== MENU CONFIG ================== */
const MENU_BY_ROLE: Record<UserRole, any[]> = {
  /* ---------- SUPER ADMIN ---------- */
  [UserRole.SUPER_ADMIN]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
    { href: "/Dashboard/companies", label: "Sociétés", icon: Building2 },
    { href: "/Dashboard/companies/create", label: "Ajouter société", icon: PlusCircle },
    { href: "/Dashboard/projects", label: "Projets", icon: Briefcase },
    { href: "/Dashboard/lead", label: "lead-list", icon: Users },
        { href: "/Dashboard/commerciale", label: "Chercher company",   icon: () => (
    <span className="relative inline-flex w-6 h-6">
      <Building className="w-6 h-6" />
      <Search className="w-3 h-3 absolute -right-0 -bottom-0 bg-white rounded-full p-0.5 text-blue-600" />
    </span>
  ), },
  ],

  /* ---------- ADMIN COMPANY ---------- */
  [UserRole.ADMIN_COMPANY]: [
    
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
    { href: "/Dashboard/projects", label: "Projets", icon: Briefcase },
    { href: "/Dashboard/lead", label: "lead-list", icon: Users },
        { href: "/Dashboard/commerciale", label: "Chercher company",   icon: () => (
    <span className="relative inline-flex w-6 h-6">
      <Building className="w-6 h-6" />
      <Search className="w-3 h-3 absolute -right-0 -bottom-0 bg-white rounded-full p-0.5 text-blue-600" />
    </span>
  ), },

  ],

 
  [UserRole.MANAGER]: [
    
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/Dashboard/project/create", label: "créer projet", icon: PlusCircle },
    { href: "/Dashboard/project", label: "liste des projets", icon: Briefcase },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
  ],

  [UserRole.PROJECT_MANAGER]: [
    { href: "/Dashboard", label: "Mes projets", icon: Briefcase },
    { href: "/Dashboard/project", label: "liste des projets", icon: Briefcase },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
  ],

  [UserRole.CALL_CENTER_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/Dashboard/agents", label: "Agents", icon: Users },
    { href: "/Dashboard/users", label: "Utilisateurs", icon: Users },
    { href: "/Dashboard/users/create", label: "Ajouter utilisateur", icon: UserPlus },
  ],

  [UserRole.SALES_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],

  [UserRole.MARKETING_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],

  [UserRole.QUALITY_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],

  [UserRole.HR_MANAGER]: [
    { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],

  /* ---------- AGENTS ---------- */
  [UserRole.AGENT_TELEPRO]: [
    { href: "/Dashboard", label: "Mes appels", icon: PhoneCall },
  ],

  [UserRole.COMMERCIAL]: [
    { href: "/Dashboard", label: "Opportunités", icon: Briefcase },
    { href: "/Dashboard/commerciale", label: "Chercher company",   icon: () => (
    <span className="relative inline-flex w-6 h-6">
      <Building className="w-6 h-6" />
      <Search className="w-3 h-3 absolute -right-0 -bottom-0 bg-white rounded-full p-0.5 text-blue-600" />
    </span>
  ), },
  ],

  [UserRole.MARKETING_AGENT]: [
    { href: "/Dashboard", label: "Campagnes", icon: Megaphone },
  ],

  [UserRole.QUALITE_AGENT]: [
    { href: "/Dashboard", label: "Contrôles qualité", icon: CheckCircle },
  ],

  [UserRole.TECH_SUPPORT]: [
    { href: "/Dashboard", label: "Tickets", icon: Headphones },
  ],

  /* ---------- MEMBER ---------- */
  [UserRole.MEMBER]: [
    { href: "/Dashboard", label: "Mon profil", icon: Settings },
    { href: "/Dashboard/project", label: "liste des projets", icon: Briefcase },
  ],
};

/* ================== COMPONENT ================== */
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

  const NavItem = ({ href, label, icon: Icon }: any) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all
          ${
            isActive
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
      >
        <Icon size={20} />
        {open && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`h-screen bg-[#0f172a] border-r border-slate-800 transition-all
        ${open ? "w-72" : "w-20"}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-9 z-50 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center"
      >
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Header */}
      <div className="flex h-20 items-center gap-4 px-6 border-b border-slate-800">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600">
          <ShieldCheck size={20} />
        </div>
        {open && (
          <div>
            <div className="text-white font-bold">ADMIN PANEL</div>
            <div className="text-xs text-slate-400 uppercase">
              {currentUser.role.replace("_", " ")}
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 p-4">
        {menu.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={20} />
          {open && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
