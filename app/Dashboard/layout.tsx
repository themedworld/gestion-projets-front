"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

type UserRole =
  | "super_admin" | "admin_company" | "manager" | "project_manager"
  | "call_center_manager" | "sales_manager" | "marketing_manager"
  | "quality_manager" | "hr_manager" | "agent_telepro" | "commercial"
  | "marketing_agent" | "qualite_agent" | "tech_support" | "member";

type User = {
  fullname: string;
  role: UserRole;
};

const allowedRoles: UserRole[] = [
  "super_admin", "admin_company", "manager", "project_manager",
  "call_center_manager", "sales_manager", "marketing_manager",
  "quality_manager", "hr_manager", "agent_telepro", "commercial",
  "marketing_agent", "qualite_agent", "tech_support", "member",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
      setIsAuthorized(true);
    } catch {
      localStorage.clear();
      router.push("/login");
    }
  }, [router]);

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar — fixed height, no shrink */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Header — sticky at top */}
        <Header />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}