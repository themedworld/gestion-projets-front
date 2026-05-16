"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Building2,
  Save,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  FileText,
  Phone,
  Loader2,
} from "lucide-react";

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_COMPANY = 'admin_company',
  MANAGER = 'manager',
  PROJECT_MANAGER = 'project_manager',
  CALL_CENTER_MANAGER = 'call_center_manager',
  SALES_MANAGER = 'sales_manager',
  MARKETING_MANAGER = 'marketing_manager',
  QUALITY_MANAGER = 'quality_manager',
  HR_MANAGER='hr_manager',
  AGENT_TELEPRO = 'agent_telepro',
  COMMERCIAL = 'commercial',
  MARKETING_AGENT = 'marketing_agent',
  QUALITE_AGENT = 'qualite_agent',
  TECH_SUPPORT = 'tech_support',
  MEMBER = 'member',
}

enum MemberLevel {
  JUNIOR = 'junior',
  SENIOR = 'senior',
  EXPERT = 'expert',
}

const ROLE_CREATION_RULES: Partial<Record<UserRole, UserRole[]>> = {
  [UserRole.SUPER_ADMIN]: Object.values(UserRole),

  [UserRole.ADMIN_COMPANY]: [
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,

    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  ],

  [UserRole.MANAGER]: [
    UserRole.MEMBER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.PROJECT_MANAGER,
  ],

  [UserRole.PROJECT_MANAGER]: [UserRole.MEMBER],

  [UserRole.CALL_CENTER_MANAGER]: [UserRole.AGENT_TELEPRO],
  [UserRole.SALES_MANAGER]: [UserRole.COMMERCIAL],
  [UserRole.MARKETING_MANAGER]: [UserRole.MARKETING_AGENT],
  [UserRole.QUALITY_MANAGER]: [UserRole.QUALITE_AGENT],
  [UserRole.HR_MANAGER]: [UserRole.MEMBER],
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: ' Super Administrateur',
  [UserRole.ADMIN_COMPANY]: ' Admin Société',
  [UserRole.MANAGER]: ' Manager',
  [UserRole.PROJECT_MANAGER]: 'Chef de projet',
  [UserRole.CALL_CENTER_MANAGER]: ' Manager Call Center',
  [UserRole.SALES_MANAGER]: ' Manager Ventes',
  [UserRole.MARKETING_MANAGER]: ' Manager Marketing',
  [UserRole.QUALITY_MANAGER]: ' Manager Qualité',
  [UserRole.HR_MANAGER]: ' Manager RH',
  [UserRole.AGENT_TELEPRO]:  'Agent Telepro',
  [UserRole.COMMERCIAL]: 'Commercial',
  [UserRole.MARKETING_AGENT]: 'Agent Marketing',
  [UserRole.QUALITE_AGENT]: 'Agent Qualité',
  [UserRole.TECH_SUPPORT]: ' Support Technique',
  [UserRole.MEMBER]: ' Membre standard',
};

const MEMBER_LEVEL_LABELS: Record<MemberLevel, string> = {
  [MemberLevel.JUNIOR]: ' Junior',
  [MemberLevel.SENIOR]: 'Senior',
  [MemberLevel.EXPERT]: ' Expert',
};

interface Company {
  id: number;
  name: string;
}

interface UserType {
  id: number;
  fullname: string;
  email: string;
  numtel: string;
  cvlink: string;
  role: UserRole;
  memberlevel?: MemberLevel | null;
  company?: Company | null;
  isActive: boolean;
}

interface CurrentUserType {
  id: number;
  role: UserRole;
  companyId?: number | null;
  company?: Company | null;
}

export default function EditUserPage({ id }: { id: string }) {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [requesterRole, setRequesterRole] = useState<UserRole | null>(null);
  const [requesterCompanyId, setRequesterCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

 useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Token manquant");

      const baseUrl = process.env.NEXT_PUBLIC_NEST_API_URL;

      // Fetch the user to edit
      const res = await fetch(`${baseUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Impossible de charger l'utilisateur");
      }
      const data: UserType = await res.json();
      setUser(data);

      // ✅ GET CURRENT USER FROM LOCALSTORAGE INSTEAD OF API
      const currentUserStr = localStorage.getItem("user");
      if (!currentUserStr) {
        throw new Error("Utilisateur connecté introuvable");
      }
      const meData: CurrentUserType = JSON.parse(currentUserStr);
      setRequesterRole(meData.role);
      setRequesterCompanyId(meData.companyId || null);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };
  fetchUser();
}, [id]);

  // ✅ Logique de permission unifiée : basée sur ROLE_CREATION_RULES
  const canManageUser = (): boolean => {
    if (!user || !requesterRole) return false;

    // Super admin peut tout faire
    if (requesterRole === UserRole.SUPER_ADMIN) return true;

    // L'utilisateur peut se gérer lui-même
    if (user.id === parseInt(id)) return true;

    // Vérifier que la cible est dans la même company
    if (user.company?.id !== requesterCompanyId) return false;

    // Vérifier si le rôle de la cible est dans les rôles gérables
    const manageableRoles = ROLE_CREATION_RULES[requesterRole] || [];
    return manageableRoles.includes(user.role);
  };

  const canEditRole = (): boolean => {
    if (!user || !requesterRole) return false;

    // Super admin peut tout faire
    if (requesterRole === UserRole.SUPER_ADMIN) return true;

    // Les autres ne peuvent pas éditer le rôle
    return false;
  };

  const canEditCompany = (): boolean => {
    if (!requesterRole) return false;
    return requesterRole === UserRole.SUPER_ADMIN;
  };

  const inputStyle = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200";
  const labelStyle = "text-sm font-bold text-slate-600 flex items-center gap-2 mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canManageUser()) {
      setError("Vous n'avez pas les permissions pour modifier cet utilisateur");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_NEST_API_URL;

      const payload: any = {
        fullname: user.fullname,
        email: user.email,
        numtel: user.numtel,
        cvlink: user.cvlink,
        isActive: user.isActive,
      };

      // ✅ Inclure role seulement si Super Admin
      if (canEditRole()) {
        payload.role = user.role;
      }

      // ✅ Inclure memberlevel seulement si le rôle est MEMBER
      if (user.role === UserRole.MEMBER) {
        payload.memberlevel = user.memberlevel;
      }

      const res = await fetch(`${baseUrl}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Échec de la mise à jour");
      }

      setSuccess(true);
      setTimeout(() => router.push("/Dashboard/users"), 2000);
    } catch (err: any) {
      setError(err.message || "Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-2 text-red-600" />
        <p className="text-red-700">{error || "Utilisateur introuvable"}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-2 text-red-600" />
        <p className="text-red-700">Utilisateur introuvable</p>
      </div>
    );
  }

  if (!canManageUser()) {
    return (
      <div className="mx-auto max-w-xl mt-10 rounded-xl bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-2 text-red-600" />
        <p className="text-red-700">Vous n'avez pas les permissions pour modifier cet utilisateur</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Bouton Retour */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-medium"
      >
        <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
          <ArrowLeft size={18} />
        </div>
        Retour à la liste
      </button>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 text-white">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/40 backdrop-blur-sm">
              <User className="text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Modifier l'utilisateur</h1>
              <p className="text-slate-400 mt-1 font-medium">Mettre à jour les informations du compte</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl text-sm flex items-center gap-3 font-medium animate-bounce">
              <CheckCircle2 size={20} />
              Utilisateur modifié avec succès ! Redirection en cours...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Nom Complet */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <User size={15} className="text-blue-500" /> Nom complet
              </label>
              <input
                required
                type="text"
                placeholder="Ex: Jean Dupont"
                className={inputStyle}
                value={user.fullname}
                onChange={(e) => setUser({ ...user, fullname: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Mail size={15} className="text-blue-500" /> Email professionnel
              </label>
              <input
                required
                type="email"
                placeholder="jean@entreprise.com"
                className={inputStyle}
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <Phone size={15} className="text-blue-500" /> Numéro de téléphone
              </label>
              <input
                required
                type="tel"
                placeholder="+216 -- --- ---"
                className={inputStyle}
                value={user.numtel}
                onChange={(e) => setUser({ ...user, numtel: e.target.value })}
              />
            </div>

            {/* Lien CV */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <FileText size={15} className="text-green-500" /> Lien vers le CV
              </label>
              <input
                
                type="url"
                placeholder="https://example.com/cv.pdf"
                className={inputStyle}
                value={user.cvlink ?? ""}
onChange={(e) => setUser({ ...user, cvlink: e.target.value })}
                
              />
            </div>

            {/* Société */}
            {canEditCompany() && (
              <div className="space-y-1">
                <label className={labelStyle}>
                  <Building2 size={15} className="text-blue-500" /> Société
                </label>
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  {user.company?.name || "Indépendant"}
                </div>
              </div>
            )}

            {/* Rôle - Visible seulement pour Super Admin */}
            {canEditRole() && (
              <div className="space-y-1">
                <label className={labelStyle}>
                  <Shield size={15} className="text-blue-500" /> Rôle
                </label>
                <div className="relative">
                  <select
                    className={`${inputStyle} appearance-none cursor-pointer`}
                    value={user.role}
                    onChange={(e) => setUser({ ...user, role: e.target.value as UserRole })}
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Shield size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* Member Level - Visible seulement si le rôle est MEMBER */}
            {user.role === UserRole.MEMBER && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className={labelStyle}>
                  <Award size={15} className="text-amber-500" /> Niveau de compétence
                </label>
                <div className="relative">
                  <select
                    required
                    className={`${inputStyle} appearance-none cursor-pointer`}
                    value={user.memberlevel || MemberLevel.JUNIOR}
                    onChange={(e) => setUser({ ...user, memberlevel: e.target.value as MemberLevel })}
                  >
                    {Object.entries(MEMBER_LEVEL_LABELS).map(([level, label]) => (
                      <option key={level} value={level}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Award size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* Statut Actif */}
            <div className="space-y-1">
              <label className={labelStyle}>
                <CheckCircle2 size={15} className="text-emerald-500" /> Statut du compte
              </label>
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="checkbox"
                  checked={user.isActive}
                  onChange={(e) => setUser({ ...user, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Compte actif</span>
                {user.isActive ? (
                  <CheckCircle2 className="text-emerald-600" size={16} />
                ) : (
                  <XCircle className="text-rose-600" size={16} />
                )}
              </div>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium italic">
              * Les champs modifiables dépendent de vos permissions
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button
                disabled={saving}
                type="submit"
                className="flex-1 sm:flex-none px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200 focus:ring-4 focus:ring-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}