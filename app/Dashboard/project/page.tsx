'use client';

import { useEffect, useState } from "react";
import { 
  Briefcase, 
  Calendar, 
  User, 
  Search, 
  Plus, 
  LayoutGrid, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Code,
  Megaphone,
  Headphones,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: number;
  name: string;
  description: string;
  domain: "IT" | "Marketing" | "CallCenter";
  status: "planned" | "in_progress" | "completed" | "on_hold" | "cancelled";
  startDate: string;
  projectManager: { id: number; fullname: string } | null; 
  assignedTo: { id: number }[];
}

export type AppUser = {
  id?: number;
  fullname?: string;
  name?: string;
  email?: string;
  role?: string; // ex: 'MANAGER' | 'PROJECT_MANAGER' | ...
};

function readUserFromLocalStorage(): AppUser | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

function decodeJwtRole(token?: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // atob may throw in some environments; wrap in try/catch
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // decodeURIComponent/escape to handle unicode
    const obj = JSON.parse(decodeURIComponent(escape(decoded)));
    if (obj.role) return String(obj.role);
    if (Array.isArray(obj.roles) && obj.roles.length) return String(obj.roles[0]);
    if (obj.userRole) return String(obj.userRole);
    if (obj.realm_access?.roles && Array.isArray(obj.realm_access.roles) && obj.realm_access.roles.length) {
      return String(obj.realm_access.roles[0]);
    }
    return null;
  } catch {
    return null;
  }
}

function getUserRoleNormalized(): string | null {
  // 1) try stored user object
  const u = readUserFromLocalStorage();
  if (u?.role) return String(u.role).toLowerCase();
  // 2) try token payload
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const roleFromToken = decodeJwtRole(token);
  if (!roleFromToken) return null;
  return String(roleFromToken).toLowerCase();
}

export default function UserProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [roleNormalized, setRoleNormalized] = useState<string | null>(null);

  useEffect(() => {
    // read user object from localStorage
    const storedUser = localStorage.getItem("user"); 
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur parsing user", e);
      }
    }

    // normalize role from either user object or token
    setRoleNormalized(getUserRoleNormalized());

    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        } else {
          console.error('Failed to fetch projects', res.status);
        }
      } catch (error) {
        console.error("Erreur chargement projets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-amber-100 text-amber-700 border-amber-200";
      case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "planned": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case "IT": return <Code size={18} className="text-indigo-600" />;
      case "Marketing": return <Megaphone size={18} className="text-rose-600" />;
      case "CallCenter": return <Headphones size={18} className="text-emerald-600" />;
      default: return <LayoutGrid size={18} />;
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projets</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {roleNormalized === 'manager' 
              ? "Gestion de vos projets et de vos responsables." 
              : "Liste des projets auxquels vous participez."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Filtrer par nom..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none w-full md:w-64"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {roleNormalized === 'manager' && (
            <Link href="/Dashboard/projects/create" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-sm">
              <Plus size={18} />
              Nouveau Projet
            </Link>
          )}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider">En cours</p>
          <p className="text-2xl font-bold text-slate-900">{projects.filter(p => p.status === 'in_progress').length}</p>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            // compute href based on normalized role
            const href =
              roleNormalized === 'manager'
                ? `/Dashboard/project/${project.id}`
                : roleNormalized === 'project_manager' || roleNormalized === 'project-manager' || roleNormalized === 'projectmanager'
                ? `/Dashboard/project/${project.id}/projectmanager_details`
                : `/Dashboard/project/${project.id}`;
                const href1 =
              roleNormalized === 'manager'
                ? `/Dashboard/project/${project.id}/sprintslist`
                : roleNormalized === 'project_manager' || roleNormalized === 'project-manager' || roleNormalized === 'projectmanager'
                ? `/Dashboard/project/${project.id}/sprintslist`
                : `/Dashboard/project/${project.id}/sprintslist`;
                const href2 =
              roleNormalized === 'manager'
                ? `/Dashboard/project/${project.id}/projectinfo`  
                : roleNormalized === 'project_manager' || roleNormalized === 'project-manager' || roleNormalized === 'projectmanager'
                ? `/Dashboard/project/${project.id}/projectinfo`  
                : `/Dashboard/project/${project.id}/projectinfo`  ;

            return (
              <div key={project.id} className="group bg-white border border-slate-200 rounded-3xl p-6 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    project.domain === 'IT' ? 'bg-indigo-50' : 
                    project.domain === 'Marketing' ? 'bg-rose-50' : 'bg-emerald-50'
                  }`}>
                    {getDomainIcon(project.domain)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${getStatusStyle(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-6 flex-grow">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                    {project.description || "Aucune description détaillée fournie."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Responsable PM</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={12} className="text-slate-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {project.projectManager?.fullname || "Non assigné"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Équipe</span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <LayoutGrid size={12} className="text-slate-400" />
                      {project.assignedTo?.length || 0} membres
                    </div>
                  </div>
                </div>

                <Link 
                  href={href}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-sm shadow-black/10"
                >
                  Accéder au projet
                  <ArrowUpRight size={16} />
                </Link>
                
                             <Link 
                  href={href1}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-sm shadow-black/10"
                >
                 Sprints
                  <ArrowUpRight size={16} />
                </Link>
                                             <Link 
                  href={href2}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-sm shadow-black/10"
                >
                 Sprints info
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <AlertCircle size={48} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Aucun projet trouvé</h2>
          <p className="text-slate-500 max-w-xs text-center mt-2 text-sm">
            Vous n'avez pas encore de projets créés ou assignés à votre compte.
          </p>
        </div>
      )}
    </div>
  );
}
