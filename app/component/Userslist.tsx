"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Shield,
  Eye,
  Pencil,
  Users,
  Filter,
  Search,
  Trash,
  Briefcase,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UserRole, ROLE_CREATION_RULES } from "@/Rolepermission";
/* ================= TYPES ================= */
interface Company {
  id: number;
  name: string;
}

interface User {
  id: number;
  fullname: string;
  email: string;
  role: string;
  company?: Company | null;
  isActive: boolean;
}

/* Current user pour permissions */
interface CurrentUser {
  id: number;
   role: UserRole;
  company?: Company | null;
}


/* ================= PAGE ================= */
export default function UserslisePage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // fetch current user
        const resUser = await fetch(
          `${process.env.NEXT_PUBLIC_NEST_API_URL}/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resUser.ok) throw new Error("Impossible de récupérer l'utilisateur courant");
        const currentUserData = await resUser.json();
        setCurrentUser(currentUserData);

        // fetch all users
        const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Accès refusé ou erreur serveur");
        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ================= PERMISSIONS ================= */
  const hasPermission = (action: "view" | "edit" | "delete", user: User) => {
    if (!currentUser) return false;

    // Super admin peut tout
    if (currentUser.role === UserRole.SUPER_ADMIN) return true;

    // Admin company peut tout dans sa société
    if (currentUser.role === UserRole.ADMIN_COMPANY) {
      if (user.company?.id === currentUser.company?.id) return true;
      return false;
    }

    // Rôles avec restrictions basées sur ROLE_CREATION_RULES
    const visibleRoles = ROLE_CREATION_RULES[currentUser.role as UserRole] || [];

    // Peut voir/éditer lui-même
    if (!visibleRoles.includes(user.role)) {
      if (user.id === currentUser.id) return action === "view" || action === "edit";
      return false;
    }

    // Vérifie la société
    if (user.company?.id && user.company?.id !== currentUser.company?.id) return false;

    if (action === "view" || action === "edit") return true;
    if (action === "delete") return user.id !== currentUser.id; // ne peut pas se supprimer lui-même

    return false;
  };

  /* ================= DELETE ================= */
  const handleDelete = async (userId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Échec de la suppression");

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  /* ================= FILTER LOGIC ================= */
  const roles = useMemo(() => ["ALL", ...new Set(users.map((u) => u.role))], [users]);
  const companies = useMemo(() => ["ALL", ...new Set(users.map((u) => u.company?.name).filter(Boolean) as string[])], [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatch = selectedRole === "ALL" || user.role === selectedRole;
      const companyMatch = selectedCompany === "ALL" || user.company?.name === selectedCompany;
      const searchMatch =
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return roleMatch && companyMatch && searchMatch;
    });
  }, [users, selectedRole, selectedCompany, searchTerm]);

  /* ================= UI ================= */
  if (loading) return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <div className="relative flex h-10 w-10">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-10 w-10 bg-indigo-500 items-center justify-center text-white">
          <Users size={20} />
        </span>
      </div>
      <p className="text-sm font-medium animate-pulse">Chargement des données...</p>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-2xl mt-10 rounded-xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <XCircle size={24} />
      </div>
      <h3 className="text-lg font-semibold text-red-800">Une erreur est survenue</h3>
      <p className="mt-2 text-sm text-red-600">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition">
        Réessayer
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Utilisateurs</h1>
          <p className="mt-1 text-slate-500">Gérez les accès, les rôles et les profils de votre organisation.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">{users.length} Total</span>
          <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{users.filter(u => u.isActive).length} Actifs</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input type="text" placeholder="Rechercher par nom ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"/>
        </div>

        <div className="md:col-span-7 flex flex-wrap md:justify-end gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <Shield size={16} className="text-slate-400" />
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer min-w-[120px]">
              {roles.map((role) => (
                <option key={role} value={role}>{role === "ALL" ? "Tous les rôles" : role}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <Building2 size={16} className="text-slate-400" />
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer min-w-[140px]">
              {companies.map((company) => (
                <option key={company} value={company}>{company === "ALL" ? "Toutes les sociétés" : company}</option>
              ))}
            </select>
          </div>

          {(selectedRole !== "ALL" || selectedCompany !== "ALL" || searchTerm !== "") && (
            <button onClick={() => {setSelectedRole("ALL"); setSelectedCompany("ALL"); setSearchTerm("");}} className="text-xs font-medium text-slate-500 hover:text-red-600 transition underline underline-offset-2">Réinitialiser</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Utilisateur</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Rôle</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Société</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Statut</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors duration-200">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">{user.fullname.substring(0,2).toUpperCase()}</div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.fullname}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200"><Shield size={12} className="fill-blue-300"/>{user.role}</span>
                  </td>
                  <td className="px-6 py-4">{user.company ? (<div className="flex items-center gap-2 text-slate-700"><div className="p-1.5 rounded-lg bg-slate-100 text-slate-500"><Building2 size={14}/></div><span className="font-medium">{user.company.name}</span></div>) : (<span className="inline-flex items-center gap-1 text-slate-400 text-xs italic"><Briefcase size={12}/>Indépendant</span>)}</td>
                  <td className="px-6 py-4"><div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>{user.isActive ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} {user.isActive ? "Actif" : "Inactif"}</div></td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {hasPermission("view", user) && <button onClick={() => router.push(`/Dashboard/users/${user.id}/details`)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm transition-all"><Eye size={16}/></button>}
                    {hasPermission("edit", user) && <button onClick={() => router.push(`/Dashboard/users/${user.id}/edit`)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:shadow-sm transition-all"><Pencil size={16}/></button>}
                    {hasPermission("delete", user) && <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:shadow-sm transition-all"><Trash size={16}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
