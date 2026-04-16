"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Import général des composants, tu peux créer une logique pour importer dynamiquement par rôle si nécessaire
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// Tous les rôles possibles
type UserRole =
  | "super_admin"
  | "admin_company"
  | "manager"
  | "project_manager"
  | "call_center_manager"
  | "sales_manager"
  | "marketing_manager"
  | "quality_manager"
  | "hr_manager"
  | "agent_telepro"
  | "commercial"
  | "marketing_agent"
  | "qualite_agent"
  | "tech_support"
  | "member";

type User = {
  fullname: string;
  role: UserRole;
};

// Tous les rôles autorisés pour accéder au layout
const allowedRoles: UserRole[] = [
  "super_admin",
  "admin_company",
  "manager",
  "project_manager",
  "call_center_manager",
  "sales_manager",
  "marketing_manager",
  "quality_manager",
  "hr_manager",
  "agent_telepro",
  "commercial",
  "marketing_agent",
  "qualite_agent",
  "tech_support",
  "member",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser: User = JSON.parse(userStr);

      if (!allowedRoles.includes(parsedUser.role)) {
        router.push("/unauthorized");
        return;
      }

      setUser(parsedUser);
      setIsAuthorized(true);
    } catch (e) {
      console.error("Erreur parsing user", e);
      localStorage.clear();
      router.push("/login");
    }
  }, [router]);

  if (!isAuthorized) return null; // Évite le flash de contenu avant redirection

  // Ici tu peux switcher dynamiquement le Header / Sidebar selon le rôle
  const HeaderComponent = Header;
  const SidebarComponent = Sidebar;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <SidebarComponent  />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <HeaderComponent />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
