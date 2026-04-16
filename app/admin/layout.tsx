"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CompanyAdminHeader from "./components/Header"
import CompanyAdminSidebar from "./components/Sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    const role = JSON.parse(user).role;
    if (role !== "admin_company" ) {
      router.push("/unauthorized");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <CompanyAdminSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <CompanyAdminHeader/>

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
